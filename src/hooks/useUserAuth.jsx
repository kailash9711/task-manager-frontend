import React, { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router';
import { UserContext } from '../context/UserContext';

export const useUserAuth = () => {
    const {user, loading, clearUser} = useContext(UserContext);
    const Navigate = useNavigate();
    useEffect(() => {
        if(loading) return;
        if(user) return
        if(!user) {
            clearUser();
            Navigate('/login');
        }
    }, [user, loading, clearUser, Navigate])
};

