// utils/generateUniqueNumber.ts
import { db } from "@/config/FirebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export const generateUniqueNumber = async (): Promise<string> => {
  const assignedNumbers: Set<string> = new Set();

  // Fetch assigned numbers from the database
  const querySnapshot = await getDocs(collection(db, "Participantes"));
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.uniqueNumber) {
      assignedNumbers.add(data.uniqueNumber.toString());
    }
  });

  let uniqueNumber: string;
  do {
    // Generate 5-digit number between 10000-99999
    const num = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
    uniqueNumber = num.toString();
  } while (assignedNumbers.has(uniqueNumber));

  return uniqueNumber;
};
