import { type GameLevel } from '../schema';

export async function getAllLevels(): Promise<GameLevel[]> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is to fetch all available game levels,
    // showing progression path and which levels are unlocked.
    return Promise.resolve([
        {
            id: 1,
            level_number: 1,
            name: "First Letters",
            description: "Learn your first Hijaiyyah letters",
            questions_required: 10,
            letters_introduced: [1, 2, 3],
            is_unlocked: true, // First level is always unlocked
            created_at: new Date()
        },
        {
            id: 2,
            level_number: 2,
            name: "Building Words",
            description: "Combine letters to form simple words",
            questions_required: 15,
            letters_introduced: [4, 5, 6],
            is_unlocked: false, // Locked until level 1 is completed
            created_at: new Date()
        }
    ] as GameLevel[]);
}