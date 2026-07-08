// Em dev (ng serve em localhost) usa o backend local; em produção usa a API no Render.
const LOCAL = 'http://localhost:8080';
const PRODUCAO = 'https://obra-n15o.onrender.com';

export const API_BASE =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? LOCAL
    : PRODUCAO;
