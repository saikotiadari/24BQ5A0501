import express, { Request, Response } from 'express';
import axios from 'axios';
import { requestLogger } from '../Logging_middleware/middleware';
import { Log } from '../Logging_middleware/logger';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(requestLogger);

const BASE_URL = 'http://4.224.186.213/evaluation-service';

const getAuthHeaders = (req: Request) => {
    return {
        headers: {
            'Authorization': req.headers['authorization'] || ''
        }
    };
};

interface VehicleTask {
    TaskID: string;
    Duration: number;
    Impact: number;
}

interface Depot {
    ID: number;
    MechanicHours: number;
}

function optimizeMaintenance(capacity: number, tasks: VehicleTask[]) {
    const n = tasks.length;
    const dp: number[][] = Array(n + 1).fill(null).map(() => Array(capacity + 1).fill(0));

    for (let i = 1; i <= n; i++) {
        const currentTask = tasks[i - 1];
        const weight = currentTask.Duration;
        const value = currentTask.Impact;

        for (let w = 0; w <= capacity; w++) {
            if (weight <= w) {
                dp[i][w] = Math.max(
                    value + dp[i - 1][w - weight], 
                    dp[i - 1][w]
                );
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }

    const selectedTasks: VehicleTask[] = [];
    let w = capacity;
    let totalImpact = dp[n][capacity];
    let totalDuration = 0;

    for (let i = n; i > 0 && w > 0; i--) {
        if (dp[i][w] !== dp[i - 1][w]) {
            const chosenTask = tasks[i - 1];
            selectedTasks.push(chosenTask);
            w -= chosenTask.Duration;
            totalDuration += chosenTask.Duration;
        }
    }

    return {
        totalImpact,
        totalDurationUsed: totalDuration,
        maxCapacityAllowed: capacity,
        scheduledTasks: selectedTasks.reverse()
    };
}

app.get('/api/schedule/:depotId', async (req: Request, res: Response) => {
    try {
        const depotId = parseInt(String(req.params.depotId));
        const headers = getAuthHeaders(req);

        const [depotsResponse, vehiclesResponse] = await Promise.all([
            axios.get<{ depots: Depot[] }>(`${BASE_URL}/depots`, headers),
            axios.get<{ vehicles: VehicleTask[] }>(`${BASE_URL}/vehicles`, headers)
        ]);

        const depots = depotsResponse.data.depots;
        const tasks = vehiclesResponse.data.vehicles;

        const targetDepot = depots.find(d => d.ID === depotId);
        if (!targetDepot) {
            await Log('backend', 'warn', 'route', `Depot lookup failed for ID: ${depotId}`);
            return res.status(404).json({ error: `Depot with ID ${depotId} not found.` });
        }

        const mechanicHoursLimit = targetDepot.MechanicHours;
        const result = optimizeMaintenance(mechanicHoursLimit, tasks);

        await Log('backend', 'info', 'service', `Optimization complete for depot ${depotId}. Total impact: ${result.totalImpact}`);

        res.json({
            depotId,
            ...result
        });

    } catch (error: any) {
        const errMsg = error.response?.data || error.message;
        await Log('backend', 'error', 'handler', `Scheduling endpoint crash: ${JSON.stringify(errMsg)}`);
        
        res.status(error.response?.status || 500).json({
            error: 'Failed to evaluate maintenance schedules',
            details: errMsg
        });
    }
});

app.listen(PORT, () => {
    console.log(`Vehicle Maintenance Microservice running on port ${PORT}`);
});
