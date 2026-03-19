'use client';
import React, { useState, useEffect } from 'react';
import { database } from '../firebaseConfig';
import { ref, set, get, remove, onValue } from 'firebase/database';

export default function FeriaCheck() {
  const [view, setView] = useState('client');
  const [vendors, setVendors] = useState([]);
  const [accounts, setAccounts] = useState({ 'admin': { password: 'admin', isAdmin: true } });
  const [currentVendor, setCurrentVendor] = useState(null);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirm, setRegisterConfirm] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [editForm, setEditForm] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [editError, setEditError] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showAdminChangePassword, setShowAdminChangePassword] = useState(false);
  const [adminOldPassword, setAdminOldPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminNewPasswordConfirm, setAdminNewPasswordConfirm] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState('');
  const [adminEditingVendor, setAdminEditingVendor] = useState(null);
  const [adminEditForm, setAdminEditForm] = useState(null);
  const [adminPhotoPreview, setAdminPhotoPreview] = useState('');
  const [loading, setLoading] = useState(true);

  // Cargar datos de Firebase
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const vendorsRef = ref(database, 'vendors');
    const accountsRef = ref(database, 'accounts');

    const unsubscribeVendors = onValue(vendorsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setVendors(Array.isArray(data) ? data : Object.values(data));
      } else {
        setVendors([]);
      }
      setLoading(false);
    });

    get(accountsRef).then((snapshot) => {
      if (snapshot.exists()) {
        setAccounts({ ...accounts, ...snapshot.val() });
      }
    });

    return () => unsubscribeVendors();
  }, []);

  // Guardar vendors en Firebase
  const saveVendorsToFirebase = (updatedVendors) => {
    set(ref(database, 'vendors'), updatedVendors);
  };

  // Guardar accounts en Firebase
  const saveAccountsToFirebase = (updatedAccounts) => {
    set(ref(database, 'accounts'), updatedAccounts);
  };

  const handleLogin = () => {
    setLoginError('');
    if (!loginUsername.trim() || !loginPassword) {
      setLoginError('Completa usuario y contraseña');
      return;
    }
    const usernameLower = loginUsername.toLowerCase();
    if (accounts[usernameLower]?.isAdmin && accounts[usernameLower].password === loginPassword) {
      setCurrentAdmin(usernameLower);
      setView('admin-panel');
      setLoginUsername('');
      setLoginPassword('');
      return;
    }
    if (!accounts[usernameLower] || accounts[usernameLower].password !== loginPassword) {
      setLoginError('Usuario o contraseña incorrectos');
      return;
    }
    const vendorId = accounts[usernameLower].vendorId;
    const vendor = vendors.find(v => v.id === vendorId);
    setCurrentVendor(vendor);
    setEditForm({ ...vendor });
    setPhotoPreview(vendor.photo || '');
    setView('vendor-panel');
    setLoginUsername('');
    setLoginPassword('');
  };

  const handleRegister = () => {
    setRegisterError('');
    setRegisterSuccess('');
    if (!registerUsername.trim() || !registerPassword || !registerConfirm) {
      setRegisterError('Completa todos los campos');
      return;
    }
    if (registerUsername.length < 3) {
      setRegisterError('El usuario debe tener al menos 3 caracteres');
      return;
    }
    if (registerPassword.length < 4) {
      setRegisterError('La contraseña debe tener al menos 4 caracteres');
      return;
    }
    if (registerPassword !== registerConfirm) {
      setRegisterError('Las contraseñas no coinciden');
      return;
    }
    const usernameLower = registerUsername.toLowerCase();
    if (accounts[usernameLower]) {
      setRegisterError('Este usuario ya existe');
      return;
    }
    const newId = Math.max(0, ...vendors.map(v => v.id || 0)) + 1;
    const newVendor = {
      id: newId,
      username: usernameLower,
      name: registerUsername,
      description: '',
      what_sell: '',
      location: '',
      schedule: '',
      isPresent: false,
      whatsapp: '',
      instagram: '',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop'
    };
    const updatedVendors = [...vendors, newVendor];
    setVendors(updatedVendors);
    saveVendorsToFirebase(updatedVendors);
    const updatedAccounts = { ...accounts, [usernameLower]: { password: registerPassword, vendorId: newId } };
    setAccounts(updatedAccounts);
    saveAccountsToFirebase(updatedAccounts);
    setRegisterSuccess('¡Cuenta creada! Podés entrar con tu usuario y contraseña.');
    setTimeout(() => {
      setRegisterUsername('');
      setRegisterPassword('');
      setRegisterConfirm('');
      setRegisterSuccess('');
      setView('vendor-login');
    }, 2000);
  };

  const handleLogout = () => {
    setCurrentVendor(null);
    setCurrentAdmin(null);
    setEditForm(null);
    setPhotoPreview('');
    setLoginUsername('');
    setLoginPassword('');
    setLoginError('');
    setShowChangePassword(false);
    setShowAdminChangePassword(false);
    setView('client');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => { setPhotoPreview(event.target.result); };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    setEditError('');
    if (!editForm.name.trim()) {
      setEditError('El nombre es obligatorio');
      return;
    }
    const updatedVendor = { ...editForm, photo: photoPreview };
    const updatedVendors = vendors.map(v => (v.id === currentVendor.id ? updatedVendor : v));
    setVendors(updatedVendors);
    saveVendorsToFirebase(updatedVendors);
    setCurrentVendor(updatedVendor);
    setEditForm(null);
    setPhotoPreview('');
  };

  const handleChangePassword = () => {
    setPasswordError('');
    if (!oldPassword || !newPassword || !newPasswordConfirm) {
      setPasswordError('Completa todos los campos');
      return;
    }
    if (accounts[currentVendor.username].password !== oldPassword) {
      setPasswordError('La contraseña actual es incorrecta');
      return;
    }
    if (newPassword.length < 4) {
      setPasswordError('La nueva contraseña debe tener al menos 4 caracteres');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setPasswordError('Las nuevas contraseñas no coinciden');
      return;
    }
    const updatedAccounts = { ...accounts, [currentVendor.username]: { ...accounts[currentVendor.username], password: newPassword } };
    setAccounts(updatedAccounts);
    saveAccountsToFirebase(updatedAccounts);
    setPasswordError('');
    setOldPassword('');
    setNewPassword('');
    setNewPasswordConfirm('');
    setShowChangePassword(false);
    alert('¡Contraseña actualizada!');
  };

  const togglePresence = () => {
    const updated = { ...currentVendor, isPresent: !currentVendor.isPresent };
    const updatedVendors = vendors.map(v => (v.id === currentVendor.id ? updated : v));
    setVendors(updatedVendors);
    saveVendorsToFirebase(updatedVendors);
    setCurrentVendor(updated);
  };

  const handleAdminChangePassword = () => {
    setAdminPasswordError('');
    if (!adminOldPassword || !adminNewPassword || !adminNewPasswordConfirm) {
      setAdminPasswordError('Completa todos los campos');
      return;
    }
    if (accounts[currentAdmin].password !== adminOldPassword) {
      setAdminPasswordError('La contraseña actual es incorrecta');
      return;
    }
    if (adminNewPassword.length < 4) {
      setAdminPasswordError('La nueva contraseña debe tener al menos 4 caracteres');
      return;
    }
    if (adminNewPassword !== adminNewPasswordConfirm) {
      setAdminPasswordError('Las nuevas contraseñas no coinciden');
      return;
    }
    const updatedAccounts = { ...accounts, [currentAdmin]: { ...accounts[currentAdmin], password: adminNewPassword } };
    setAccounts(updatedAccounts);
    saveAccountsToFirebase(updatedAccounts);
    setAdminPasswordError('');
    setAdminOldPassword('');
    setAdminNewPassword('');
    setAdminNewPasswordConfirm('');
    setShowAdminChangePassword(false);
    alert('¡Contraseña admin actualizada!');
  };

  const handleAdminPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => { setAdminPhotoPreview(event.target.result); };
      reader.readAsDataURL(file);
    }
  };

  const handleAdminSaveVendor = () => {
    if (!adminEditForm.name.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    const updatedVendor = { ...adminEditForm, photo: adminPhotoPreview };
    const updatedVendors = vendors.map(v => (v.id === adminEditingVendor.id ? updatedVendor : v));
    setVendors(updatedVendors);
    saveVendorsToFirebase(updatedVendors);
    setAdminEditingVendor(null);
    setAdminEditForm(null);
    setAdminPhotoPreview('');
  };

  const handleDeleteVendor = (vendorId) => {
    if (window.confirm('¿Seguro que querés borrar este vendedor? No se puede deshacer.')) {
      const vendorToDelete = vendors.find(v => v.id === vendorId);
      const updatedVendors = vendors.filter(v => v.id !== vendorId);
      setVendors(updatedVendors);
      saveVendorsToFirebase(updatedVendors);
      const newAccounts = { ...accounts };
      delete newAccounts[vendorToDelete.username];
      setAccounts(newAccounts);
      saveAccountsToFirebase(newAccounts);
    }
  };

  const openWhatsApp = (phone) => {
    const message = encodeURIComponent('Hola, me interesa tu servicio');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const openInstagram = (handle) => {
    window.open(`https://instagram.com/${handle}`, '_blank');
  };

  const sortedVendors = [...vendors].sort((a, b) => {
    if (a.isPresent === b.isPresent) return 0;
    return a.isPresent ? -1 : 1;
  });

  if (loading) return <div className="min-h-screen bg-slate-100 flex items-center justify-center"><p className="text-2xl">Cargando...</p></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">🛍️ FeriaCheck</h1>
          {(currentVendor || currentAdmin) && (
            <button onClick={handleLogout} className="px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg transition">Cerrar Sesión</button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        {view === 'client' && (
          <div>
            <div className="mb-8 text-center">
              <p className="text-lg text-slate-600 font-medium">Aquí encontrás todos los vendedores de la plaza</p>
              <p className="text-sm text-slate-500 mt-2">🟢 Verde = Presente | ⚪ Gris = No está</p>
            </div>
            {sortedVendors.length === 0 ? (
              <div className="text-center py-12"><p className="text-lg text-slate-600 mb-4">Aún no hay vendedores registrados</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {sortedVendors.map(vendor => (
                  <div key={vendor.id} className={`rounded-xl overflow-hidden shadow-md border-2 transition-all ${vendor.isPresent ? 'bg-white border-green-300 shadow-lg' : 'bg-slate-50 border-gray-300 opacity-75'}`}>
                    <div className="bg-gradient-to-br from-slate-200 to-slate-300 h-48 flex items-center justify-center overflow-hidden">
                      <img src={vendor.photo} alt={vendor.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xl font-bold text-slate-900 flex-1">{vendor.name}</h2>
                        <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 ${vendor.isPresent ? 'bg-green-500 border-green-600' : 'bg-gray-400 border-gray-500'}`} />
                      </div>
                      {vendor.what_sell && <p className="text-sm font-semibold text-slate-700 mb-2">📦 {vendor.what_sell}</p>}
                      {vendor.description && <p className="text-sm text-slate-600 mb-3 line-clamp-2">{vendor.description}</p>}
                      {vendor.location && <p className="text-xs text-slate-600 mb-1">📍 {vendor.location}</p>}
                      {vendor.schedule && <p className="text-xs text-slate-600 mb-3">⏰ {vendor.schedule}</p>}
                      <p className="text-xs text-slate-500 mb-4">{vendor.isPresent ? '✅ Presente hoy' : '❌ No disponible'}</p>
                      <div className="flex gap-2">
                        {vendor.whatsapp && <button onClick={() => openWhatsApp(vendor.whatsapp)} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg transition text-sm">💬 WhatsApp</button>}
                        {vendor.instagram && <button onClick={() => openInstagram(vendor.instagram)} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-3 rounded-lg transition text-sm">📷 IG</button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-4 justify-center mt-12 flex-wrap">
              <button onClick={() => setView('vendor-login')} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition">🔐 Vendedor - Entrar</button>
              <button onClick={() => setView('vendor-register')} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition">➕ Crear Cuenta</button>
              <button onClick={() => setView('admin-login')} className="px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-lg transition text-sm">👑 Admin</button>
            </div>
          </div>
        )}

        {view === 'vendor-login' && !currentVendor && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">Iniciar Sesión Vendedor</h2>
              <p className="text-slate-600 text-center mb-6">Ingresa tus credenciales</p>
              <div className="space-y-4">
                <input type="text" placeholder="Usuario" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} className="w-full border-2 border-slate-300 rounded-lg p-3 focus:outline-none focus:border-blue-500" />
                <input type="password" placeholder="Contraseña" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} className="w-full border-2 border-slate-300 rounded-lg p-3 focus:outline-none focus:border-blue-500" />
                {loginError && <p className="text-red-500 text-sm font-semibold text-center">{loginError}</p>}
                <div className="space-y-2">
                  <button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition">Ingresar</button>
                  <button onClick={() => setView('client')} className="w-full bg-slate-300 hover:bg-slate-400 text-slate-900 font-bold py-3 rounded-lg transition">Volver</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'vendor-register' && !currentVendor && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">Crear Cuenta Vendedor</h2>
              <p className="text-slate-600 text-center mb-6">Registrate en la feria</p>
              <div className="space-y-4">
                <input type="text" placeholder="Usuario (mín. 3 caracteres)" value={registerUsername} onChange={(e) => setRegisterUsername(e.target.value)} className="w-full border-2 border-slate-300 rounded-lg p-3 focus:outline-none focus:border-blue-500" />
                <input type="password" placeholder="Contraseña (mín. 4 caracteres)" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} className="w-full border-2 border-slate-300 rounded-lg p-3 focus:outline-none focus:border-blue-500" />
                <input type="password" placeholder="Confirmar contraseña" value={registerConfirm} onChange={(e) => setRegisterConfirm(e.target.value)} className="w-full border-2 border-slate-300 rounded-lg p-3 focus:outline-none focus:border-blue-500" />
                {registerError && <p className="text-red-500 text-sm font-semibold text-center">{registerError}</p>}
                {registerSuccess && <p className="text-green-600 text-sm font-semibold text-center">{registerSuccess}</p>}
                <div className="space-y-2">
                  <button onClick={handleRegister} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition">Crear Cuenta</button>
                  <button onClick={() => setView('client')} className="w-full bg-slate-300 hover:bg-slate-400 text-slate-900 font-bold py-3 rounded-lg transition">Volver</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'vendor-panel' && currentVendor && (
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2 text-center">Panel de {currentVendor.name}</h2>
            <div className="max-w-md mx-auto bg-white rounded-xl p-8 shadow-lg mb-6">
              <p className="text-center text-slate-600 mb-6 font-semibold">¿Estás en la feria hoy?</p>
              <button onClick={togglePresence} className={`w-full h-32 rounded-xl border-4 flex items-center justify-center text-5xl font-bold transition-all mb-4 ${currentVendor.isPresent ? 'bg-green-500 border-green-600 text-white shadow-lg' : 'bg-gray-400 border-gray-500 text-white'}`}>
                {currentVendor.isPresent ? '✓ SÍ' : '✕ NO'}
              </button>
              <p className="text-center text-sm text-slate-600">{currentVendor.isPresent ? '✅ Marcado como presente' : '❌ Marcado como ausente'}</p>
            </div>

            {editForm ? (
              <div className="max-w-2xl mx-auto bg-white rounded-xl p-8 shadow-lg mb-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">Editar Perfil</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Foto de Perfil</label>
                    {photoPreview && <div className="w-32 h-32 rounded-full mb-3 overflow-hidden border-4 border-slate-300 mx-auto"><img src={photoPreview} alt="Preview" className="w-full h-full object-cover" /></div>}
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="w-full border-2 border-slate-300 rounded-lg p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre del Puesto *</label>
                    <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full border-2 border-slate-300 rounded-lg p-3 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">¿Qué vendes?</label>
                    <input type="text" placeholder="Ej: Clases de matemática" value={editForm.what_sell} onChange={(e) => setEditForm({ ...editForm, what_sell: e.target.value })} className="w-full border-2 border-slate-300 rounded-lg p-3 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Descripción</label>
                    <textarea placeholder="Información adicional" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full border-2 border-slate-300 rounded-lg p-3 focus:outline-none focus:border-blue-500 h-24" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Ubicación</label>
                    <input type="text" placeholder="Ej: Pasillo 2" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} className="w-full border-2 border-slate-300 rounded-lg p-3 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Horarios</label>
                    <input type="text" placeholder="Ej: Lunes a viernes 15:00-18:00" value={editForm.schedule} onChange={(e) => setEditForm({ ...editForm, schedule: e.target.value })} className="w-full border-2 border-slate-300 rounded-lg p-3 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">WhatsApp</label>
                    <input type="tel" placeholder="Ej: 5491234567890" value={editForm.whatsapp} onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })} className="w-full border-2 border-slate-300 rounded-lg p-3 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Instagram (sin @)</label>
                    <input type="text" placeholder="Ej: miinstagram" value={editForm.instagram} onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })} className="w-full border-2 border-slate-300 rounded-lg p-3 focus:outline-none focus:border-blue-500" />
                  </div>
                  {editError && <p className="text-red-500 text-sm font-semibold">{editError}</p>}
                  <div className="flex gap-3 pt-4">
                    <button onClick={handleSaveProfile} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition">💾 Guardar</button>
                    <button onClick={() => setEditForm(null)} className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-900 font-bold py-3 rounded-lg transition">Cancelar</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto bg-white rounded-xl p-8 shadow-lg mb-6">
                <div className="flex gap-6 mb-6 flex-col md:flex-row items-center md:items-start">
                  <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-slate-300 flex-shrink-0">
                    <img src={currentVendor.photo} alt={currentVendor.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-bold text-slate-900">{currentVendor.name}</h3>
                    {currentVendor.what_sell && <p className="text-slate-600 mt-2">📦 {currentVendor.what_sell}</p>}
                    {currentVendor.location && <p className="text-slate-600">📍 {currentVendor.location}</p>}
                    {currentVendor.schedule && <p className="text-slate-600">⏰ {currentVendor.schedule}</p>}
                  </div>
                </div>
                {currentVendor.description && <p className="text-slate-600 mb-6 p-4 bg-slate-50 rounded-lg">{currentVendor.description}</p>}
                <div className="flex gap-3">
                  <button onClick={() => setEditForm({ ...currentVendor })} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition">✏️ Editar</button>
                  <button onClick={() => setShowChangePassword(!showChangePassword)} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg transition">🔑 Cambiar Contraseña</button>
                </div>
              </div>
            )}

            {showChangePassword && (
              <div className="max-w-md mx-auto bg-white rounded-xl p-8 shadow-lg mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Cambiar Contraseña</h3>
                <div className="space-y-3">
                  <input type="password" placeholder="Contraseña actual" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="w-full border-2 border-slate-300 rounded-lg p-3 focus:outline-none focus:border-blue-500" />
                  <input type="password" placeholder="Nueva contraseña" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border-2 border-slate-300 rounded-lg p-3 focus:outline-none focus:border-blue-500" />
                  <input type="password" placeholder="Confirmar" value={newPasswordConfirm} onChange={(e) => setNewPasswordConfirm(e.target.value)} className="w-full border-2 border-slate-300 rounded-lg p-3 focus:outline-none focus:border-blue-500" />
                  {passwordError && <p className="text-red-500 text-sm font-semibold text-center">{passwordError}</p>}
                  <div className="flex gap-2">
                    <button onClick={handleChangePassword} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg transition">Actualizar</button>
                    <button onClick={() => { setShowChangePassword(false); setOldPassword(''); setNewPassword(''); setNewPasswordConfirm(''); setPasswordError(''); }} className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-900 font-bold py-3 rounded-lg transition">Cancelar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'admin-login' && !currentAdmin && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">👑 Panel de Admin</h2>
              <p className="text-slate-600 text-center mb-6">Acceso restringido</p>
              <div className="space-y-4">
                <input type="text" placeholder="Usuario Admin" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} className="w-full border-2 border-slate-300 rounded-lg p-3 focus:outline-none focus:border-blue-500" />
                <input type="password" placeholder="Contraseña" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} className="w-full border-2 border-slate-300 rounded-lg p-3 focus:outline-none focus:border-blue-500" />
                {loginError && <p className="text-red-500 text-sm font-semibold text-center">{loginError}</p>}
                <div className="space-y-2">
                  <button onClick={handleLogin} className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition">Ingresar</button>
                  <button onClick={() => setView('client')} className="w-full bg-slate-300 hover:bg-slate-400 text-slate-900 font-bold py-3 rounded-lg transition">Volver</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'admin-panel' && currentAdmin && (
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">👑 Panel de Administración</h2>
            <div className="flex gap-3 justify-center mb-6 flex-wrap">
              <button onClick={() => setShowAdminChangePassword(!showAdminChangePassword)} className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition">🔑 Cambiar Contraseña</button>
            </div>
            {showAdminChangePassword && (
              <div className="max-w-md mx-auto bg-white rounded-xl p-8 shadow-lg mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Cambiar Contraseña Admin</h3>
                <div className="space-y-3">
                  <input type="password" placeholder="Contraseña actual" value={adminOldPassword} onChange={(e) => setAdminOldPassword(e.target.value)} className="w-full border-2 border-slate-300 rounded-lg p-3 focus:outline-none focus:border-blue-500" />
                  <input type="password" placeholder="Nueva contraseña" value={adminNewPassword} onChange={(e) => setAdminNewPassword(e.target.value)} className="w-full border-2 border-slate-300 rounded-lg p-3 focus:outline-none focus:border-blue-500" />
                  <input type="password" placeholder="Confirmar" value={adminNewPasswordConfirm} onChange={(e) => setAdminNewPasswordConfirm(e.target.value)} className="w-full border-2 border-slate-300 rounded-lg p-3 focus:outline-none focus:border-blue-500" />
                  {adminPasswordError && <p className="text-red-500 text-sm font-semibold text-center">{adminPasswordError}</p>}
                  <div className="flex gap-2">
                    <button onClick={handleAdminChangePassword} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg transition">Actualizar</button>
                    <button onClick={() => { setShowAdminChangePassword(false); setAdminOldPassword(''); setAdminNewPassword(''); setAdminNewPasswordConfirm(''); setAdminPasswordError(''); }} className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-900 font-bold py-3 rounded-lg transition">Cancelar</button>
                  </div>
                </div>
              </div>
            )}
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Gestionar Vendedores ({vendors.length})</h3>
            {vendors.length === 0 ? (
              <p className="text-center text-slate-600">No hay vendedores registrados</p>
            ) : (
              <div className="space-y-4">
                {vendors.map(vendor => (
                  <div key={vendor.id} className="bg-white rounded-xl p-6 shadow-md border-l-4 border-slate-400">
                    {adminEditingVendor?.id === vendor.id && adminEditForm ? (
                      <div className="space-y-4">
                        <h4 className="text-xl font-bold text-slate-900">Editando: {vendor.name}</h4>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Foto</label>
                          {adminPhotoPreview && <div className="w-24 h-24 rounded-full mb-3 overflow-hidden border-4 border-slate-300 mx-auto"><img src={adminPhotoPreview} alt="Preview" className="w-full h-full object-cover" /></div>}
                          <input type="file" accept="image/*" onChange={handleAdminPhotoUpload} className="w-full border-2 border-slate-300 rounded-lg p-2" />
                        </div>
                        <input type="text" value={adminEditForm.name} onChange={(e) => setAdminEditForm({ ...adminEditForm, name: e.target.value })} className="w-full border-2 border-slate-300 rounded-lg p-3" placeholder="Nombre" />
                        <input type="text" value={adminEditForm.what_sell} onChange={(e) => setAdminEditForm({ ...adminEditForm, what_sell: e.target.value })} className="w-full border-2 border-slate-300 rounded-lg p-3" placeholder="¿Qué venden?" />
                        <textarea value={adminEditForm.description} onChange={(e) => setAdminEditForm({ ...adminEditForm, description: e.target.value })} className="w-full border-2 border-slate-300 rounded-lg p-3 h-20" placeholder="Descripción" />
                        <input type="text" value={adminEditForm.location} onChange={(e) => setAdminEditForm({ ...adminEditForm, location: e.target.value })} className="w-full border-2 border-slate-300 rounded-lg p-3" placeholder="Ubicación" />
                        <input type="text" value={adminEditForm.schedule} onChange={(e) => setAdminEditForm({ ...adminEditForm, schedule: e.target.value })} className="w-full border-2 border-slate-300 rounded-lg p-3" placeholder="Horarios" />
                        <input type="tel" value={adminEditForm.whatsapp} onChange={(e) => setAdminEditForm({ ...adminEditForm, whatsapp: e.target.value })} className="w-full border-2 border-slate-300 rounded-lg p-3" placeholder="WhatsApp" />
                        <input type="text" value={adminEditForm.instagram} onChange={(e) => setAdminEditForm({ ...adminEditForm, instagram: e.target.value })} className="w-full border-2 border-slate-300 rounded-lg p-3" placeholder="Instagram" />
                        <label className="flex items-center gap-3">
                          <input type="checkbox" checked={adminEditForm.isPresent} onChange={(e) => setAdminEditForm({ ...adminEditForm, isPresent: e.target.checked })} className="w-5 h-5" />
                          <span className="font-semibold text-slate-700">Presente</span>
                        </label>
                        <div className="flex gap-2">
                          <button onClick={handleAdminSaveVendor} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition">💾 Guardar</button>
                          <button onClick={() => { setAdminEditingVendor(null); setAdminEditForm(null); setAdminPhotoPreview(''); }} className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-900 font-bold py-2 rounded-lg transition">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-6">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-300 flex-shrink-0">
                          <img src={vendor.photo} alt={vendor.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-slate-900">{vendor.name}</h4>
                          <p className="text-sm text-slate-600">👤 @{vendor.username}</p>
                          <p className="text-sm text-slate-600">📦 {vendor.what_sell || 'Sin especificar'}</p>
                          <p className="text-sm text-slate-600">📍 {vendor.location || 'Sin ubicación'}</p>
                          <p className="text-sm text-slate-600">⏰ {vendor.schedule || 'Sin horarios'}</p>
                          <p className={`text-sm font-bold mt-2 ${vendor.isPresent ? 'text-green-600' : 'text-red-600'}`}>{vendor.isPresent ? '✅ Presente' : '❌ Ausente'}</p>
                        </div>
                        <div className="flex gap-2 flex-col">
                          <button onClick={() => { setAdminEditingVendor(vendor); setAdminEditForm({ ...vendor }); setAdminPhotoPreview(vendor.photo); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition text-sm">✏️ Editar</button>
                          <button onClick={() => handleDeleteVendor(vendor.id)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition text-sm">🗑️ Borrar</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-white py-6 mt-12 text-center text-sm">
        <p>© 2026 Feria de Vendedores</p>
        <p className="mt-2">Diseñado por <a href="https://www.informaticoartel.com.ar" target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-blue-300 transition">@InformaticoArtel</a></p>
      </footer>
    </div>
  );
}
