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
  const [users, setUsers] = useState([
    { email: 'test@example.com', password: hashPassword('123456') }
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isLogin) {
      // Login
      const user = users.find(u => u.email === email);
      if (!user || user.password !== hashPassword(password)) {
        setError('Credenciales incorrectas');
        return;
      }
      onLogin(user);
    } else {
      // Registro
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      if (users.find(user => user.email === email)) {
        setError('Este correo ya está registrado');
        return;
      }

      const newUser = { email, password: hashPassword(password) };
      setUsers([...users, newUser]);
      setSuccess('Usuario registrado exitosamente');
      setTimeout(() => {
        setIsLogin(true);
        setEmail('');
        setPassword('');
        setSuccess('');
      }, 1500);
    }
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
          setIsLogin(!isLogin);
          setError('');
          setSuccess('');
        }}>
          {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </a>
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
    setTasks(tasks.filter(task => task.id !== taskId));
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