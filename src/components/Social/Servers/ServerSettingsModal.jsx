import React, { useState, useEffect } from 'react';
import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../services/firebase";
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { X, Settings as SettingsIcon, Shield, Users, Trash2, Plus } from "lucide-react";
import { Permission, hasPermission, ALL_PERMISSIONS } from "../../../lib/permissions";

export default function ServerSettingsModal({ serverId, onClose }) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [server, setServer] = useState(null);
  const [roles, setRoles] = useState([]);
  
  // Overview Tab State
  const [serverName, setServerName] = useState("");
  
  // Roles Tab State
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleNameInput, setRoleNameInput] = useState("");
  const [roleColorInput, setRoleColorInput] = useState("#99aab5");

  useEffect(() => {
      if (!serverId) return;
      
      const unsubServer = onSnapshot(doc(db, "servers", serverId), (d) => {
          if (d.exists()) {
              const data = d.data();
              setServer({ id: d.id, ...data });
              setServerName(data.name);
          }
      });
      
      const qRoles = query(collection(db, "roles"), where("serverId", "==", serverId));
      const unsubRoles = onSnapshot(qRoles, (snap) => {
          const loadedRoles = snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => b.position - a.position);
          setRoles(loadedRoles);
      });

      return () => { unsubServer(); unsubRoles(); }
  }, [serverId]);

  const handleUpdateServer = async () => {
      try {
          await updateDoc(doc(db, "servers", serverId), { name: serverName });
      } catch (err) {
          console.error(err);
      }
  };

  const handleDeleteServer = async () => {
      if (!server || server.ownerId !== currentUser?.uid) {
          alert("Only the owner can delete the server.");
          return;
      }
      
      const confirmName = window.prompt(`To confirm deletion, type the server name: ${server.name}`);
      if (confirmName !== server.name) return;
      
      try {
          await deleteDoc(doc(db, "servers", serverId));
          onClose(); // Assuming parent handles resetting activeServer when deleted
      } catch (err) {
          console.error(err);
      }
  };

  const handleCreateRole = async () => {
      try {
          const newRole = {
              serverId,
              name: "new role",
              color: "#99aab5",
              permissions: 0,
              position: roles.length,
              isMentionable: false,
              isHoisted: false,
              isEveryoneRole: false
          };
          await addDoc(collection(db, "roles"), newRole);
      } catch(err) {
          console.error(err);
      }
  };

  const handleUpdateRole = async () => {
      if (!selectedRole) return;
      try {
          await updateDoc(doc(db, "roles", selectedRole.id), {
              name: roleNameInput,
              color: roleColorInput
          });
      } catch(err) {
          console.error(err);
      }
  };
  
  const handleDeleteRole = async (rId) => {
      try {
          await deleteDoc(doc(db, "roles", rId));
          setSelectedRole(null);
      } catch(err) {
          console.error(err);
      }
  };

  if (!server) return null;

  return (
      <div className="fixed inset-0 z-[100] flex bg-[#0b0c10]/95 backdrop-blur-sm text-slate-300">
          
          {/* Sidebar */}
          <div className="w-1/3 max-w-[250px] bg-[#1e293b] flex flex-col justify-start items-end py-14 px-4 h-full border-r border-white/5">
              <div className="w-full max-w-[200px] flex flex-col gap-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 px-3">
                      {server.name}
                  </div>
                  
                  <button 
                      onClick={() => setActiveTab('overview')}
                      className={`text-left px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-slate-100'}`}
                  >
                      Overview
                  </button>
                  <button 
                      onClick={() => setActiveTab('roles')}
                      className={`text-left px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'roles' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-slate-100'}`}
                  >
                      Roles
                  </button>
                  
                  <div className="my-2 border-b border-white/5"></div>
                  
                  <button 
                      onClick={onClose}
                      className="text-left px-3 py-1.5 rounded-md text-sm font-medium hover:bg-white/5 hover:text-slate-100 flex items-center justify-between"
                  >
                      Close Settings <X size={16} />
                  </button>
              </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto h-full px-10 py-14">
              <div className="max-w-2xl">
                  
                  {activeTab === 'overview' && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                          <h2 className="text-xl font-display font-bold text-white mb-6">Server Overview</h2>
                          
                          <div className="flex gap-8 mb-8">
                              <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center border-2 border-dashed border-white/20 text-slate-400 cursor-pointer hover:border-indigo-500 hover:text-indigo-400 transition-colors">
                                  {server.iconUrl ? <img src={server.iconUrl} className="w-full h-full rounded-full object-cover"/> : "Upload"}
                              </div>
                              <div className="flex-1">
                                  <label className="block text-xs uppercase font-semibold text-slate-400 mb-2">Server Name</label>
                                  <input 
                                     type="text" 
                                     value={serverName}
                                     onChange={e => setServerName(e.target.value)}
                                     className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-indigo-500 transition-colors"
                                  />
                              </div>
                          </div>
                          
                          <div className="flex justify-end border-t border-white/10 pt-4 mt-8">
                              <button onClick={handleUpdateServer} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                  Save Changes
                              </button>
                          </div>
                          
                          {/* Danger Zone */}
                          <div className="mt-12 pt-6 border-t border-red-500/20">
                              <h3 className="text-red-400 font-bold mb-4">Danger Zone</h3>
                              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center justify-between">
                                  <div>
                                      <h4 className="text-white font-medium">Delete Server</h4>
                                      <p className="text-slate-400 text-xs mt-1">This action cannot be undone. This will permanently delete the server and all channels/messages.</p>
                                  </div>
                                  <button onClick={handleDeleteServer} className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                      Delete Server
                                  </button>
                              </div>
                          </div>
                      </div>
                  )}

                  {activeTab === 'roles' && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 flex h-[600px] gap-6">
                          
                          {/* Role List */}
                          <div className="w-64 flex flex-col border-r border-white/5 pr-6 h-full">
                              <div className="flex justify-between items-center mb-4">
                                  <h2 className="font-display font-bold text-white">Roles</h2>
                                  <button onClick={handleCreateRole} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors" title="Create Role"><Plus size={16}/></button>
                              </div>
                              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-2">
                                  {roles.map(r => (
                                      <button 
                                          key={r.id}
                                          onClick={() => {
                                              setSelectedRole(r);
                                              setRoleNameInput(r.name);
                                              setRoleColorInput(r.color);
                                          }}
                                          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left ${selectedRole?.id === r.id ? 'bg-indigo-600/20 text-indigo-300' : 'hover:bg-white/5'}`}
                                      >
                                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: r.color}}></div>
                                          <span className="truncate flex-1">{r.name}</span>
                                      </button>
                                  ))}
                              </div>
                          </div>
                          
                          {/* Role Editor */}
                          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                              {selectedRole ? (
                                  <div>
                                      <div className="flex items-center justify-between mb-6">
                                          <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                              Edit Role - <span style={{color: selectedRole.color}}>{selectedRole.name}</span>
                                          </h2>
                                          {!selectedRole.isEveryoneRole && (
                                              <button onClick={() => handleDeleteRole(selectedRole.id)} className="text-red-400 hover:text-red-300 text-sm font-medium">Delete Role</button>
                                          )}
                                      </div>
                                      
                                      <div className="flex flex-col gap-6">
                                          <div>
                                              <label className="block text-xs uppercase font-semibold text-slate-400 mb-2">Role Name</label>
                                              <input type="text" value={roleNameInput} onChange={e => setRoleNameInput(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-indigo-500" disabled={selectedRole.isEveryoneRole}/>
                                          </div>
                                          
                                          <div>
                                              <label className="block text-xs uppercase font-semibold text-slate-400 mb-2">Role Color</label>
                                              <div className="flex gap-2">
                                                  <input type="color" value={roleColorInput} onChange={e => setRoleColorInput(e.target.value)} className="w-10 h-10 rounded border-none cursor-pointer bg-transparent"/>
                                                  <input type="text" value={roleColorInput} onChange={e => setRoleColorInput(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-indigo-500 uppercase"/>
                                              </div>
                                          </div>
                                          
                                          <div className="bg-[#1e293b] p-4 rounded-lg border border-white/5 flex items-center justify-between">
                                              <div>
                                                  <h3 className="text-white font-medium">Display role members separately from online members</h3>
                                                  <p className="text-xs text-slate-400">Also known as "Hoisting"</p>
                                              </div>
                                              <div className="w-10 h-6 bg-slate-700 rounded-full relative cursor-pointer">
                                                  <div className="absolute top-1 left-1 w-4 h-4 bg-slate-400 rounded-full"></div>
                                              </div>
                                          </div>
                                          
                                          <div className="flex justify-end border-t border-white/10 pt-4">
                                              <button onClick={handleUpdateRole} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                                  Save Changes
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              ) : (
                                  <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                                      Select a role to edit its properties.
                                  </div>
                              )}
                          </div>
                      </div>
                  )}

              </div>
          </div>
      </div>
  );
}
