import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { ChatHistory, ChatMessage } from '@/types/chat';

export const saveChatHistory = async (userId: string, messages: ChatMessage[]) => {
  try {
    const chatHistory: Omit<ChatHistory, 'id'> = {
      userId,
      messages,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      title: messages[0]?.content.slice(0, 50) || '新对话'
    };

    const docRef = await addDoc(collection(db, 'chatHistories'), chatHistory);
    return docRef.id;
  } catch (error) {
    console.error('Error saving chat history:', error);
    throw error;
  }
};

export const getChatHistories = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'chatHistories'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatHistory[];
  } catch (error) {
    console.error('Error getting chat histories:', error);
    throw error;
  }
};

export const updateChatHistory = async (
  chatId: string,
  messages: ChatMessage[],
  title?: string
) => {
  try {
    const chatRef = doc(db, 'chatHistories', chatId);
    await updateDoc(chatRef, {
      messages,
      updatedAt: Date.now(),
      ...(title ? { title } : {})
    });
  } catch (error) {
    console.error('Error updating chat history:', error);
    throw error;
  }
};

export const deleteChatHistory = async (chatId: string) => {
  try {
    const chatRef = doc(db, 'chatHistories', chatId);
    await deleteDoc(chatRef);
  } catch (error) {
    console.error('Error deleting chat history:', error);
    throw error;
  }
};