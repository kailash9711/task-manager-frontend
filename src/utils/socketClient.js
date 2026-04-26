import { io } from 'socket.io-client';
import { BASE_URL } from './apiPaths';

let socket = null;

const getAuthToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken') || '';

export const connectSocket = () => {
  const token = getAuthToken();
  if (!token) return null;

  if (socket && socket.connected) {
    return socket;
  }

  socket = io(BASE_URL, {
    transports: ['websocket'],
    auth: {
      token,
    },
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
