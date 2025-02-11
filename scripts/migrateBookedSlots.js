import mongoose from 'mongoose';
import Trainer from '../model/Trainer.js';

async function migrateBookedSlots() {
    try {
        const trainers = await Trainer.find({});
        
        for (const trainer of trainers) {
            // Обновляем каждый bookedSlot
            trainer.bookedSlots = trainer.bookedSlots.map(slot => {
                if (!slot.client) {
                    return {
                        date: slot.date,
                        startTime: slot.startTime,
                        duration: slot.duration,
                        client: {
                            tgId: slot.clientId, // Старое поле
                            first_name: 'Client', // Дефолтное значение
                            nickname: ''
                        }
                    };
                }
                return slot;
            });
            
            await trainer.save();
        }
        
        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    }
} 