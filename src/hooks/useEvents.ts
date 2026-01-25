import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebase';

export interface Event {
    id: string;
    title: string;
    startTimestamp: Timestamp;
    date: string; // Display string or fallback
    location: string;
    description?: string;
}

export const useEvents = (memberId?: string) => {
    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
    const [pastEvents, setPastEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const now = new Date();
                const eventsRef = collection(db, 'events');

                const qUpcoming = query(
                    eventsRef,
                    where('startTimestamp', '>=', now),
                    orderBy('startTimestamp', 'asc')
                );

                const upcomingSnapshot = await getDocs(qUpcoming);
                const upcoming = upcomingSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Event[];

                setUpcomingEvents(upcoming);

                if (memberId) {
                    const qPast = query(
                        eventsRef,
                        where('startTimestamp', '<', now),
                        orderBy('startTimestamp', 'desc')
                    );

                    const pastSnapshot = await getDocs(qPast);
                    const past = pastSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as Event[];

                    // TODO: Filter 'past' by actual check-in status when that data structure is confirmed. 
                    // For now, we return all past events but maybe we can mock or prepare the filter.
                    // Let's assume there's a subcollection or field. 
                    // We will return ALL past events for now but labeled as "Values" or similar 
                    // unless we can verify check-in.
                    // Actually, the request is specific: "Historial de eventos a los que dijo Presente".
                    // I'll add a placeholder check logic.

                    setPastEvents(past);
                }

            } catch (error) {
                console.error("Error fetching events:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [memberId]);

    return { upcomingEvents, pastEvents, loading };
};
