import { RecentTask } from './recentTask';

export interface BusinessStats {
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    recentTasks: RecentTask[];
}
