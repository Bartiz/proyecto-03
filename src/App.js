import React, { useState, useEffect } from 'react';
import './App.css';

// Función para hashear contraseñas
const hashPassword = (password) => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

// Categorías predefinidas
const CATEGORIES = [
  { id: 'personal', name: 'Personal', icon: '👤', color: '#667eea' },
  { id: 'supermercado', name: 'Supermercado', icon: '🛒', color: '#4ecdc4' },
  { id: 'salud', name: 'Salud', icon: '🏥', color: '#ff6b6b' },
  { id: 'citas', name: 'Citas', icon: '📅', color: '#feca57' },
  { id: 'reuniones', name: 'Reuniones', icon: '👥', color: '#48dbfb' },
  { id: 'llamadas', name: 'Llamadas', icon: '📞', color: '#ff9ff3' },
  { id: 'trabajo', name: 'Trabajo', icon: '💼', color: '#54a0ff' },
  { id: 'estudios', name: 'Estudios', icon: '📚', color: '#5f27cd' },
  { id: 'hogar', name: 'Hogar', icon: '🏠', color: '#00d2d3' },
  { id: 'otros', name: 'Otros', icon: '📝', color: '#6c757d' }
];

// Utilidades para fechas y horas
const DateTimeUtils = {
  // Obtener fecha y hora actual en formato para inputs
  getCurrentDateTime: () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`,
      datetime: `${year}-${month}-${day}T${hours}:${minutes}`
    };
  },

  // Formatear fecha y hora para mostrar
  formatDateTime: (dateString, timeString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const dateFormatted = date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });

    if (timeString) {
      return `${dateFormatted} a las ${timeString}`;
    }
    
    return dateFormatted;
  },

  // Combinar fecha y hora en un objeto Date
  combineDateTime: (dateString, timeString) => {
    if (!dateString) return null;
    
    if (timeString) {
      return new Date(`${dateString}T${timeString}`);
    }
    
    return new Date(dateString);
  },

  // Obtener estado de la fecha límite con hora
  getDeadlineStatus: (dateString, timeString) => {
    if (!dateString) return null;
    
    const now = new Date();
    const deadline = DateTimeUtils.combineDateTime(dateString, timeString);
    const diffMs = deadline - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMs < 0) {
      const overdueDays = Math.abs(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      const overdueHours = Math.abs(Math.floor(diffMs / (1000 * 60 * 60))) % 24;
      
      let overdueText = 'Vencida';
      if (overdueDays > 0) {
        overdueText += ` (${overdueDays} día${overdueDays > 1 ? 's' : ''})`;
      } else if (overdueHours > 0) {
        overdueText += ` (${overdueHours} hora${overdueHours > 1 ? 's' : ''})`;
      }
      
      return { status: 'overdue', text: overdueText, color: '#ff4757', urgent: true };
    } else if (diffHours < 1) {
      const minutes = Math.floor(diffMs / (1000 * 60));
      return { status: 'urgent', text: `${minutes} min`, color: '#ff3742', urgent: true };
    } else if (diffHours < 24) {
      const hours = Math.floor(diffHours);
      return { status: 'today', text: `${hours}h`, color: '#ff6b35', urgent: true };
    } else if (diffDays === 1) {
      return { status: 'tomorrow', text: 'Mañana', color: '#f39c12', urgent: false };
    } else if (diffDays <= 3) {
      return { status: 'soon', text: `${diffDays} días`, color: '#f39c12', urgent: false };
    } else if (diffDays <= 7) {
      return { status: 'week', text: `${diffDays} días`, color: '#3498db', urgent: false };
    } else {
      return { status: 'future', text: `${diffDays} días`, color: '#95a5a6', urgent: false };
    }
  }
};

// Componente de Login/Registro (sin cambios)
const AuthForm = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getUsersFromStorage = () => {
    try {
      const storedUsers = localStorage.getItem('todoapp_users');
      return storedUsers ? JSON.parse(storedUsers) : [];
    } catch (error) {
      console.error('Error al leer usuarios del localStorage:', error);
      return [];
    }
  };

  const saveUsersToStorage = (users) => {
    try {
      localStorage.setItem('todoapp_users', JSON.stringify(users));
    } catch (error) {
      console.error('Error al guardar usuarios en localStorage:', error);
    }
  };

  const [users, setUsers] = useState(() => {
    const storedUsers = getUsersFromStorage();
    if (storedUsers.length === 0) {
      const defaultUsers = [
        { 
          email: 'prueba@prueba.com', 
          password: hashPassword('123456'),
          fullName: 'Usuario de Prueba'
        }
      ];
      saveUsersToStorage(defaultUsers);
      return defaultUsers;
    }
    return storedUsers;
  });

  useEffect(() => {
    saveUsersToStorage(users);
  }, [users]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getPasswordStrength = (password) => {
    if (password.length < 6) return { strength: 'weak', text: 'Muy débil', color: '#ff4757' };
    if (password.length < 8) return { strength: 'medium', text: 'Media', color: '#ffa502' };
    if (password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { strength: 'strong', text: 'Fuerte', color: '#2ed573' };
    }
    return { strength: 'medium', text: 'Media', color: '#ffa502' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (isLogin) {
      const currentUsers = getUsersFromStorage();
      const user = currentUsers.find(u => u.email === email);
      
      if (!user) {
        setError('Este correo no está registrado. Por favor, regístrate primero.');
        setIsLoading(false);
        return;
      }
      
      if (user.password !== hashPassword(password)) {
        setError('Contraseña incorrecta');
        setIsLoading(false);
        return;
      }
      
      setSuccess('¡Inicio de sesión exitoso!');
      setTimeout(() => {
        onLogin(user);
      }, 500);
      
    } else {
      if (!fullName.trim()) {
        setError('El nombre completo es requerido');
        setIsLoading(false);
        return;
      }

      if (!validateEmail(email)) {
        setError('Por favor ingresa un email válido');
        setIsLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        setIsLoading(false);
        return;
      }

      const currentUsers = getUsersFromStorage();
      
      if (currentUsers.find(user => user.email === email)) {
        setError('Este correo ya está registrado. Puedes iniciar sesión.');
        setIsLoading(false);
        return;
      }

      const newUser = { 
        email, 
        password: hashPassword(password),
        fullName: fullName.trim()
      };
      const updatedUsers = [...currentUsers, newUser];
      
      setUsers(updatedUsers);
      saveUsersToStorage(updatedUsers);
      
      setSuccess('¡Cuenta creada exitosamente! Redirigiendo...');
      
      setTimeout(() => {
        setIsLogin(true);
        setEmail('');
        setPassword('');
        setFullName('');
        setSuccess('');
        setError('');
        setIsLoading(false);
      }, 2000);
      return;
    }
    setIsLoading(false);
  };

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setError('');
    setSuccess('');
    setShowPassword(false);
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    clearForm();
  };

  const passwordStrength = !isLogin ? getPasswordStrength(password) : null;

  return (
    <div className="auth-wrapper">
      <div className="auth-container-professional">
        <div className="auth-header-professional">
          <div className="company-logo">
            <div className="logo-icon">📋</div>
            <div className="company-info">
              <h1>TaskMaster Pro</h1>
              <p>Gestión profesional de tareas</p>
            </div>
          </div>
        </div>

        <div className="auth-content-professional">
          <div className="form-header">
            <h2>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
            <p className="form-subtitle">
              {isLogin 
                ? 'Accede a tu espacio de trabajo' 
                : 'Únete a TaskMaster Pro'
              }
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="auth-form-professional">
            {!isLogin && (
              <div className="form-group-professional">
                <div className="form-label-wrapper">
                  <span className="form-label-icon">👤</span>
                  <label className="form-label">Nombre Completo</label>
                </div>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin}
                    placeholder="Ingresa tu nombre completo"
                    className="form-input-professional"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
            
            <div className="form-group-professional">
              <div className="form-label-wrapper">
                <span className="form-label-icon">📧</span>
                <label className="form-label">Correo Electrónico</label>
              </div>
              <div className="input-wrapper">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nombre@empresa.com"
                  className={`form-input-professional ${!isLogin && email && !validateEmail(email) ? 'input-error' : ''}`}
                  disabled={isLoading}
                />
                {!isLogin && email && (
                  <span className={`validation-icon ${validateEmail(email) ? 'valid' : 'invalid'}`}>
                    {validateEmail(email) ? '✓' : '✗'}
                  </span>
                )}
              </div>
            </div>
            
            <div className="form-group-professional">
              <div className="form-label-wrapper">
                <span className="form-label-icon">🔒</span>
                <label className="form-label">Contraseña</label>
              </div>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={isLogin ? "Tu contraseña" : "Mínimo 6 caracteres"}
                  className="form-input-professional"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              
              {!isLogin && password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill" 
                      style={{ 
                        width: password.length < 6 ? '33%' : password.length < 8 ? '66%' : '100%',
                        backgroundColor: passwordStrength.color 
                      }}
                    ></div>
                  </div>
                  <span className="strength-text" style={{ color: passwordStrength.color }}>
                    {passwordStrength.text}
                  </span>
                </div>
              )}
            </div>
            
            {error && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠️</span>
                {error}
              </div>
            )}
            
            {success && (
              <div className="alert alert-success">
                <span className="alert-icon">✅</span>
                {success}
              </div>
            )}
            
            <button 
              type="submit" 
              className={`btn-professional ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading-content">
                  <span className="spinner"></span>
                  Procesando...
                </span>
              ) : (
                isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
              )}
            </button>
          </form>
          
          <div className="form-footer">
            <p>
              {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
              <button 
                type="button"
                className="link-button" 
                onClick={switchMode}
                disabled={isLoading}
              >
                {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
              </button>
            </p>
          </div>
          
          <div className="demo-credentials">
            <h4>Cuenta de demostración:</h4>
            <div className="demo-info">
              <div className="demo-item">
                <strong>Email:</strong> prueba@prueba.com
              </div>
              <div className="demo-item">
                <strong>Contraseña:</strong> 123456
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de Alertas Flotantes mejorado
const FloatingAlerts = ({ tasks }) => {
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  const now = new Date();
  
  // Tareas vencidas
  const overdueTasks = tasks.filter(task => {
    if (task.completed || !task.deadline) return false;
    const deadline = DateTimeUtils.combineDateTime(task.deadline, task.deadlineTime);
    return deadline < now;
  });
  
  // Tareas urgentes (próximas 2 horas)
  const urgentTasks = tasks.filter(task => {
    if (task.completed || !task.deadline) return false;
    const deadline = DateTimeUtils.combineDateTime(task.deadline, task.deadlineTime);
    const diffMs = deadline - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 2;
  });

  // Tareas de hoy
  const todayString = now.toISOString().split('T')[0];
  const todayTasks = tasks.filter(task => 
    !task.completed && 
    task.deadline === todayString &&
    !urgentTasks.includes(task) &&
    !overdueTasks.includes(task)
  );

  const dismissAlert = (alertType) => {
    setDismissedAlerts(prev => new Set([...prev, alertType]));
  };

  useEffect(() => {
    setDismissedAlerts(new Set());
  }, [tasks.length]);

  return (
    <div className="floating-alerts">
      {overdueTasks.length > 0 && !dismissedAlerts.has('overdue') && (
        <div className="floating-alert overdue">
          <div className="float-content">
            <div className="float-header">
              <span className="float-icon">🚨</span>
              <span className="float-title">
                {overdueTasks.length} vencida{overdueTasks.length > 1 ? 's' : ''}
              </span>
              <button 
                className="float-dismiss"
                onClick={() => dismissAlert('overdue')}
                title="Cerrar"
              >
                ✕
              </button>
            </div>
            {overdueTasks.length <= 2 && (
              <div className="float-tasks">
                {overdueTasks.map(task => (
                  <div key={task.id} className="float-task">
                    {task.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {urgentTasks.length > 0 && !dismissedAlerts.has('urgent') && (
        <div className="floating-alert urgent">
          <div className="float-content">
            <div className="float-header">
              <span className="float-icon">⏰</span>
              <span className="float-title">
                {urgentTasks.length} urgente{urgentTasks.length > 1 ? 's' : ''}
              </span>
              <button 
                className="float-dismiss"
                onClick={() => dismissAlert('urgent')}
                title="Cerrar"
              >
                ✕
              </button>
            </div>
            {urgentTasks.length <= 2 && (
              <div className="float-tasks">
                {urgentTasks.map(task => (
                  <div key={task.id} className="float-task">
                    {task.text} - {DateTimeUtils.formatDateTime(task.deadline, task.deadlineTime)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {todayTasks.length > 0 && !dismissedAlerts.has('today') && (
        <div className="floating-alert today">
          <div className="float-content">
            <div className="float-header">
              <span className="float-icon">📅</span>
              <span className="float-title">
                {todayTasks.length} para hoy
              </span>
              <button 
                className="float-dismiss"
                onClick={() => dismissAlert('today')}
                title="Cerrar"
              >
                ✕
              </button>
            </div>
            {todayTasks.length <= 2 && (
              <div className="float-tasks">
                {todayTasks.map(task => (
                  <div key={task.id} className="float-task">
                    {task.text}
                    {task.deadlineTime && ` - ${task.deadlineTime}`}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de Tarea Individual mejorado
const TaskItemExtended = ({ task, onToggle, onEdit, onDelete, categoryColor }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff4757';
      case 'medium': return '#ffa502';
      case 'low': return '#2ed573';
      default: return '#95a5a6';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const deadlineStatus = DateTimeUtils.getDeadlineStatus(task.deadline, task.deadlineTime);
  const priorityColor = getPriorityColor(task.priority);
  const priorityIcon = getPriorityIcon(task.priority);

  return (
    <div className={`task-item-extended ${task.completed ? 'completed' : ''} ${deadlineStatus?.status || ''}`}>
      <div className="task-main-content">
        <div className="task-indicators">
          <div className="task-category-indicator" style={{ backgroundColor: categoryColor }}></div>
          {task.priority && (
            <div className="task-priority-indicator" style={{ color: priorityColor }}>
              {priorityIcon}
            </div>
          )}
        </div>
        
        <div className="task-text-content">
          <div className={`task-text ${task.completed ? 'completed' : ''}`}>
            {task.text}
          </div>
          
          {task.deadline && (
            <div className="task-deadline" style={{ color: deadlineStatus.color }}>
              <span className="deadline-icon">📅</span>
              <span className="deadline-text">
                {DateTimeUtils.formatDateTime(task.deadline, task.deadlineTime)} • {deadlineStatus.text}
              </span>
              {deadlineStatus.urgent && (
                <span className="deadline-urgent">⚡</span>
              )}
            </div>
          )}
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

// Componente de Categoría mejorado
const CategorySection = ({ category, tasks, onAddTask, onToggleTask, onEditTask, onDeleteTask }) => {
  const [newTask, setNewTask] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [isExpanded, setIsExpanded] = useState(true);
  const [showTimeField, setShowTimeField] = useState(false);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    const taskData = {
      text: newTask.trim(),
      deadline: newTaskDate || null,
      deadlineTime: (newTaskDate && newTaskTime) ? newTaskTime : null,
      priority: newTaskPriority
    };
    
    onAddTask(taskData, category.id);
    setNewTask('');
    setNewTaskDate('');
    setNewTaskTime('');
    setNewTaskPriority('medium');
    setShowTimeField(false);
  };

  const categoryTasks = tasks.filter(task => task.category === category.id);
  const completedCount = categoryTasks.filter(task => task.completed).length;

  const getTodayDate = () => {
    return DateTimeUtils.getCurrentDateTime().date;
  };

  const getCurrentTime = () => {
    return DateTimeUtils.getCurrentDateTime().time;
  };

  // Función para autocompletar hora cuando se selecciona fecha de hoy
  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setNewTaskDate(selectedDate);
    
    const today = getTodayDate();
    if (selectedDate === today) {
      setShowTimeField(true);
      if (!newTaskTime) {
        setNewTaskTime(getCurrentTime());
      }
    } else {
      setShowTimeField(false);
      setNewTaskTime('');
    }
  };

  // Ordenar tareas por urgencia, prioridad y fecha límite
  const sortedTasks = categoryTasks.sort((a, b) => {
    // Primero por completado (no completadas primero)
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    
    // Luego por urgencia de fecha límite
    const aStatus = DateTimeUtils.getDeadlineStatus(a.deadline, a.deadlineTime);
    const bStatus = DateTimeUtils.getDeadlineStatus(b.deadline, b.deadlineTime);
    
    if (aStatus && bStatus) {
      const urgencyOrder = {
        'overdue': 5,
        'urgent': 4,
        'today': 3,
        'tomorrow': 2,
        'soon': 1,
        'week': 0,
        'future': -1
      };
      
      const urgencyDiff = (urgencyOrder[aStatus.status] || 0) - (urgencyOrder[bStatus.status] || 0);
      if (urgencyDiff !== 0) return -urgencyDiff;
    }
    
    // Luego por prioridad
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
    if (priorityDiff !== 0) return priorityDiff;
    
    // Finalmente por fecha límite (más próximas primero)
    if (a.deadline && b.deadline) {
      const aDeadline = DateTimeUtils.combineDateTime(a.deadline, a.deadlineTime);
      const bDeadline = DateTimeUtils.combineDateTime(b.deadline, b.deadlineTime);
      return aDeadline - bDeadline;
    }
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return 0;
  });

  return (
    <div className="category-section">
      <div 
        className="category-header" 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ borderLeftColor: category.color }}
      >
        <div className="category-info">
          <span className="category-icon">{category.icon}</span>
          <span className="category-name">{category.name}</span>
          <span className="task-count">
            {completedCount}/{categoryTasks.length}
          </span>
        </div>
        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
      </div>

      {isExpanded && (
        <div className="category-content">
          <form onSubmit={handleAddTask} className="add-task-form">
            <div className="task-input-group-extended">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder={`Nueva tarea en ${category.name.toLowerCase()}...`}
                className="task-input-main"
                required
              />
              
              <div className="task-options">
                <div className="task-option">
                  <label className="task-option-label">📅 Fecha límite:</label>
                  <input
                    type="date"
                    value={newTaskDate}
                    onChange={handleDateChange}
                    className="task-date-input"
                    min={getTodayDate()}
                  />
                </div>
                
                {(showTimeField || newTaskTime) && (
                  <div className="task-option">
                    <label className="task-option-label">🕐 Hora límite:</label>
                    <input
                      type="time"
                      value={newTaskTime}
                      onChange={(e) => setNewTaskTime(e.target.value)}
                      className="task-time-input"
                    />
                  </div>
                )}
                
                <div className="task-option">
                  <label className="task-option-label">⚡ Prioridad:</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="task-priority-select"
                  >
                    <option value="low">🟢 Baja</option>
                    <option value="medium">🟡 Media</option>
                    <option value="high">🔴 Alta</option>
                  </select>
                </div>
                
                {newTaskDate && !showTimeField && (
                  <div className="task-option">
                    <button
                      type="button"
                      onClick={() => {
                        setShowTimeField(true);
                        setNewTaskTime(getCurrentTime());
                      }}
                      className="btn-add-time"
                    >
                      ➕ Agregar hora
                    </button>
                  </div>
                )}
              </div>
              
              <button type="submit" className="btn-add-task-extended" style={{ backgroundColor: category.color }}>
                ➕ Agregar Tarea
              </button>
            </div>
          </form>

          <div className="tasks-in-category">
            {categoryTasks.length === 0 ? (
              <div className="no-tasks-category">
                No hay tareas en {category.name.toLowerCase()}
              </div>
            ) : (
              sortedTasks.map(task => (
                <TaskItemExtended
                  key={task.id}
                  task={task}
                  onToggle={onToggleTask}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  categoryColor={category.color}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente Principal de Tareas
const TodoApp = ({ user, onLogout }) => {
  const [tasks, setTasks] = useState([]);
  const [taskIdCounter, setTaskIdCounter] = useState(1);

  // Cargar tareas del localStorage al inicializar
  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem(`todoapp_tasks_${user.email}`);
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        setTasks(parsedTasks);
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

  const addTask = (taskData, categoryId) => {
    const task = {
      id: taskIdCounter,
      text: taskData.text || taskData,
      completed: false,
      category: categoryId,
      userId: user.email,
      createdAt: new Date().toISOString(),
      deadline: taskData.deadline || null,
      deadlineTime: taskData.deadlineTime || null,
      priority: taskData.priority || 'medium'
    };

    setTasks([...tasks, task]);
    setTaskIdCounter(taskIdCounter + 1);
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
  const totalTasks = userTasks.length;
  const completedTasks = userTasks.filter(task => task.completed).length;

  // Estadísticas mejoradas
  const pendingTasks = userTasks.filter(task => !task.completed);
  const now = new Date();
  
  const overdueTasks = pendingTasks.filter(task => {
    if (!task.deadline) return false;
    const deadline = DateTimeUtils.combineDateTime(task.deadline, task.deadlineTime);
    return deadline < now;
  }).length;

  const urgentTasks = pendingTasks.filter(task => {
    if (!task.deadline) return false;
    const deadline = DateTimeUtils.combineDateTime(task.deadline, task.deadlineTime);
    const diffMs = deadline - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 2;
  }).length;

  const todayTasks = pendingTasks.filter(task => {
    if (!task.deadline) return false;
    const today = now.toISOString().split('T')[0];
    return task.deadline === today && !overdueTasks && !urgentTasks;
  }).length;

  return (
    <div className="todo-container">
      <div className="user-info">
        <div className="user-welcome">
          <span className="welcome-text">¡Hola, {user.fullName}! 👋</span>
          <span className="user-email">{user.email}</span>
          <div className="progress-info">
            <span>{completedTasks}/{totalTasks} completadas</span>
            {overdueTasks > 0 && (
              <span className="overdue-count"> • {overdueTasks} vencidas</span>
            )}
            {urgentTasks > 0 && (
              <span className="urgent-count"> • {urgentTasks} urgentes</span>
            )}
            {todayTasks > 0 && (
              <span className="today-count"> • {todayTasks} para hoy</span>
            )}
          </div>
        </div>
        <button onClick={onLogout} className="btn btn-secondary logout-btn">
          Cerrar Sesión
        </button>
      </div>

      <div className="categories-container">
        {CATEGORIES.map(category => (
          <CategorySection
            key={category.id}
            category={category}
            tasks={userTasks}
            onAddTask={addTask}
            onToggleTask={toggleTask}
            onEditTask={editTask}
            onDeleteTask={deleteTask}
          />
        ))}
      </div>

      <FloatingAlerts tasks={userTasks} />
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