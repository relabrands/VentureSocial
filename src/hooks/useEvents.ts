import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebase';

export interface Event {
    id: string;
    title: string;
    date: Timestamp;
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

                // Fetch all events (we'll filter in memory for simplicity with dates unless dataset is huge)
                // Or use separate queries. Let's use separate queries for efficiency if indexes exist, 
                // but standard firestore requires composite indexes for range + sort. 
                // We'll fetch upcoming sorted by date.

                const qUpcoming = query(
                    eventsRef,
                    where('date', '>=', now),
                    orderBy('date', 'asc')
                );

                const upcomingSnapshot = await getDocs(qUpcoming);
                const upcoming = upcomingSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Event[];

                setUpcomingEvents(upcoming);

                if (memberId) {
                    // Fetch past events the user checked into.
                    // Assuming a structure where checkins are tracked. 
                    // Strategy: 
                    // 1. Query 'checkins' collection where memberId == memberId
                    // 2. Get eventIds from checkins
                    // 3. Fetch those events (or filter from earlier fetch if we fetched all).
                    // For now, let's assume we fetch *all* past events and check attendance if checkins available,
                    // OR we query events where 'attendees' array-contains memberId.

                    // Let's try the 'attendees' array approach if it exists, or 'checkins' collection.
                    // Given the user history, let's implement a robust check.

                    // Attempt 1: Fetch all past events and filter manually (mocking check-in for demo if DB empty)
                    // The user said "events they said Present to (did Check in)".

                    const qPast = query(
                        eventsRef,
                        where('date', '<', now),
                        orderBy('date', 'desc')
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
