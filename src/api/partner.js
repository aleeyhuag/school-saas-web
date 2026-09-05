import axios from 'axios';
const client=axios.create({baseURL:import.meta.env.VITE_API_BASE_URL,timeout:15000});
client.interceptors.request.use(c=>{const t=localStorage.getItem('partner_token');if(t)c.headers.Authorization=`Bearer ${t}`;return c;});
export const register=(p)=>client.post('/partner/register',p).then(r=>r.data);
export const login=(p)=>client.post('/partner/login',p).then(r=>r.data);
export const me=()=>client.get('/partner/me').then(r=>r.data);
export const logout=()=>client.post('/partner/logout').then(r=>r.data);
