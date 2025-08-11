import React, { useState, useEffect } from 'react';
import './App.css';

// Función para hashear contraseñas (simulación simple)
const hashPassword = (password) => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

// Componente de Login/Registro
const AuthForm = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Función para obtener usuarios del localStorage
  const getUsersFromStorage = () => {
    try {
      const storedUsers = localStorage.getItem('todoapp_users');
      return storedUsers ? JSON.parse(storedUsers) : [];
    } catch (error) {
      console.error('Error al leer usuarios del localStorage:', error);
      return [];
    }
  };

  // Función para guardar usuarios en localStorage
  const saveUsersToStorage = (users) => {
    try {
      localStorage.setItem('todoapp_users', JSON.stringify(users));
    } catch (error) {
      console.error('Error al guardar usuarios en localStorage:', error);
    }
  };

  // Inicializar usuarios desde localStorage
  const [users, setUsers] = useState(() => {
    const storedUsers = getUsersFromStorage();
    // Si no hay usuarios, crear uno de prueba
    if (storedUsers.length === 0) {
      const defaultUsers = [
        { email: 'prueba@prueba.com', password: hashPassword('123456') }
      ];
      saveUsersToStorage(defaultUsers);
      return defaultUsers;
    }
    return storedUsers;
  });

  // Actualizar localStorage cuando cambie el estado de usuarios
  useEffect(() => {
    saveUsersToStorage(users);
  }, [users]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isLogin) {
      // Login - Validar que el usuario exista
      const currentUsers = getUsersFromStorage();
      const user = currentUsers.find(u => u.email === email);
      
      if (!user) {
        setError('Este correo no está registrado. Por favor, regístrate primero.');
        return;
      }
      
      if (user.password !== hashPassword(password)) {
        setError('Contraseña incorrecta');
        return;
      }
      
      onLogin(user);
      
    } else {
      // Registro
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      const currentUsers = getUsersFromStorage();
      
      if (currentUsers.find(user => user.email === email)) {
        setError('Este correo ya está registrado. Puedes iniciar sesión.');
        return;
      }

      const newUser = { email, password: hashPassword(password) };
      const updatedUsers = [...currentUsers, newUser];
      
      setUsers(updatedUsers);
      saveUsersToStorage(updatedUsers);
      
      setSuccess('¡Usuario registrado exitosamente! Puedes iniciar sesión ahora.');
      
      setTimeout(() => {
        setIsLogin(true);
        setEmail('');
        setPassword('');
        setSuccess('');
        setError('');
      }, 2000);
    }
  };

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setError('');
    setSuccess('');
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    clearForm();
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1>To-Do App</h1>
        <p>Gestiona tus tareas personales</p>
      </div>
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label>Correo Electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="ejemplo@correo.com"
          />
        </div>
        
        <div className="form-group">
          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={isLogin ? undefined : 6}
            placeholder={isLogin ? "Tu contraseña" : "Mínimo 6 caracteres"}
          />
        </div>
        
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        
        <button type="submit" className="btn btn-primary">
          {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
        </button>
      </form>
      
      <div className="switch-form">
        <a href="#" onClick={(e) => {
          e.preventDefault();
          switchMode();
        }}>
          {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </a>
      </div>
      
      {/* Información de usuario de prueba */}
      <div className="test-user-info">
        <p><strong>Usuario de prueba:</strong></p>
        <p>Email: prueba@prueba.com</p>
        <p>Contraseña: 123456</p>
      </div>
    </div>
  );
};

// Componente de Tarea Individual
const TaskItem = ({ task, onToggle, onEdit, onDelete }) => {
  return (
    <div className="task-item">
      <div className="task-content">
        <div className={`task-text ${task.completed ? 'completed' : ''}`}>
          {task.text}
        </div>
      </div>
      <div className="task-actions">
        <button 
          className="btn-small btn-complete" 
          onClick={() => onToggle(task.id)}
          title={task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
        >
          {task.completed ? '↶' : '✓'}
        </button>
        <button 
          className="btn-small btn-edit" 
          onClick={() => onEdit(task.id)}
          title="Editar tarea"
        >
          ✎
        </button>
        <button 
          className="btn-small btn-delete" 
          onClick={() => onDelete(task.id)}
          title="Eliminar tarea"
        >
          ✗
        </button>
      </div>
    </div>
  );
};

// Componente Principal de Tareas
const TodoApp = ({ user, onLogout }) => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [taskIdCounter, setTaskIdCounter] = useState(1);

  // Cargar tareas del localStorage al inicializar
  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem(`todoapp_tasks_${user.email}`);
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        setTasks(parsedTasks);
        // Establecer el contador basado en el ID más alto
        if (parsedTasks.length > 0) {
          const maxId = Math.max(...parsedTasks.map(task => task.id));
          setTaskIdCounter(maxId + 1);
        }
      }
    } catch (error) {
      console.error('Error al cargar tareas del localStorage:', error);
    }
  }, [user.email]);

  // Guardar tareas en localStorage cuando cambien
  useEffect(() => {
    try {
      localStorage.setItem(`todoapp_tasks_${user.email}`, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error al guardar tareas en localStorage:', error);
    }
  }, [tasks, user.email]);

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const task = {
      id: taskIdCounter,
      text: newTask.trim(),
      completed: false,
      userId: user.email
    };

    setTasks([...tasks, task]);
    setTaskIdCounter(taskIdCounter + 1);
    setNewTask('');
  };

  const toggleTask = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, completed: !task.completed }
        : task
    ));
  };

  const editTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const newText = prompt('Editar tarea:', task.text);
      if (newText && newText.trim()) {
        setTasks(tasks.map(t => 
          t.id === taskId 
            ? { ...t, text: newText.trim() }
            : t
        ));
      }
    }
  };

  const deleteTask = (taskId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      setTasks(tasks.filter(task => task.id !== taskId));
    }
  };

  const userTasks = tasks.filter(task => task.userId === user.email);

  return (
    <div className="todo-container">
      <div className="user-info">
        <div>Bienvenido, <span className="user-email">{user.email}</span></div>
        <button onClick={onLogout} className="btn btn-secondary logout-btn">
          Cerrar Sesión
        </button>
      </div>

      <form onSubmit={addTask} className="task-form">
        <div className="form-group">
          <label>Nueva Tarea</label>
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Escribe tu tarea..."
            required
          />
        </div>
        <button type="submit" className="btn btn-success">
          Agregar Tarea
        </button>
      </form>

      <div className="tasks-list">
        {userTasks.length === 0 ? (
          <div className="no-tasks">No tienes tareas pendientes</div>
        ) : (
          userTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onEdit={editTask}
              onDelete={deleteTask}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Componente Principal de la App
function App() {
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="App">
      {currentUser ? (
        <TodoApp user={currentUser} onLogout={handleLogout} />
      ) : (
        <AuthForm onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;