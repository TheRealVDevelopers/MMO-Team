import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { USERS } from '../constants';
import { UserRole } from '../types';

export const migrateUsersToFirestore = async () => {
    try {
        console.log("Checking if user migration is needed...");
        const migrationDocRef = doc(db, 'system', 'migrations');
        const migrationDoc = await getDoc(migrationDocRef);

        if (migrationDoc.exists() && migrationDoc.data().usersMigrated) {
            console.log("Users already migrated.");
            return;
        }

        console.log("Starting user migration...");
        const batchPromises = USERS.map(async (user) => {
            const userRef = doc(db, 'staffUsers', user.id);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    ...user,
                    email: user.email || `${user.id}@makemyoffice.com`, // Fallback email
                    role: user.role,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    lastUpdateTimestamp: serverTimestamp(),
                    migratedAt: serverTimestamp()
                });
                console.log(`Migrated user: ${user.name}`);
            }
        });

        await Promise.all(batchPromises);

        await setDoc(migrationDocRef, { usersMigrated: true }, { merge: true });
        console.log("User migration completed successfully.");

    } catch (error) {
        console.error("Migration failed:", error);
    }
};
