import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { User, PushNotification } from '@/types';
import { supabaseService } from '@/services/supabaseService';

export const [AdminProvider, useAdmin] = createContextHook(() => {
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      return await supabaseService.getUsers();
    },
  });

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      return await supabaseService.getNotifications();
    },
  });

  useEffect(() => {
    if (usersQuery.data) {
      setUsers(usersQuery.data);
    }
  }, [usersQuery.data]);

  useEffect(() => {
    if (notificationsQuery.data) {
      setNotifications(notificationsQuery.data);
    }
  }, [notificationsQuery.data]);

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await supabaseService.deleteUser(userId);
      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async ({ title, body }: { title: string; body: string }) => {
      await supabaseService.sendNotification(title, body);
      // Refresh notifications after sending
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      return { title, body };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteUser = (userId: string) => {
    return deleteUserMutation.mutateAsync(userId);
  };

  const sendNotification = (title: string, body: string, sentBy: string) => {
    return sendNotificationMutation.mutateAsync({ title, body });
  };

  return {
    users,
    notifications,
    isLoading: usersQuery.isLoading || notificationsQuery.isLoading,
    deleteUser,
    sendNotification,
    deleteUserPending: deleteUserMutation.isPending,
    sendNotificationPending: sendNotificationMutation.isPending,
  };
});
