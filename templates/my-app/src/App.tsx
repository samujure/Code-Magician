import React, { useEffect, useState } from 'react';
import './App.css';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase_config'; // Import config file

// Define the shape of the Firestore data
interface User {
  id: string;
  name: string;
  email: string;
}

const Component: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch data from Firebase on component mount
  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, 'users')); // Connect to 'users' collection
      const userList: User[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      setUsers(userList);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="container">
      <h1 data-component="hello_world" className="rainbow-text">Hello World!</h1>
      <p data-component="paragraph" className="purple-text">This is a new paragraph of text added to the component.</p>
    </div>
  );
};

export default Component;