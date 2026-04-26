/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useState } from 'react'
import axiosInstance from '../utils/axiosInstance';
import { createContext } from 'react';
import { API_PATHS } from '../utils/apiPaths';
import { connectSocket, disconnectSocket } from '../utils/socketClient';
import { addNotification } from '../utils/notifications';
import { toast } from 'react-toastify';


export const UserContext = createContext();

export const UserProvider = ({ children }) => {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        const accessToken = localStorage.getItem('token');

        if (accessToken) {
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
        }

        if(!accessToken) {
            setLoading(false);
            return;
        }

        const fetchUser = async () => {
            try {
                const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
                setUser(response.data);
            }
            catch (error) {
                console.error('Error fetching user profile:', error);
                localStorage.removeItem('token');
            }
            finally {
                setLoading(false);
            }
        }
        fetchUser();
    }, [])

    const updateUser = (userData) => {
        setUser(userData);
        localStorage.setItem('token', userData.token);
        setLoading(false);
    };

    const clearUser = () => {
        setUser(null);
        localStorage.removeItem('token');
        disconnectSocket();
    };

    useEffect(() => {
        if (!user?._id) return;

        const socket = connectSocket();
        if (!socket) return;

        const onNotification = (payload) => {
            addNotification(payload);
            toast.info(payload?.title ? `${payload.title}: ${payload.message || ''}` : payload?.message || 'New notification');
        };

        socket.on('notification', onNotification);

        return () => {
            socket.off('notification', onNotification);
        };
    }, [user?._id]);

    if (isAuthenticated === null) {
        return <div>Loading...</div>; // Prevents flickering or premature redirect
    }

  return (
    <UserContext.Provider value={{ user, loading, updateUser, clearUser }}>
        {children}
    </UserContext.Provider>
  )
}
