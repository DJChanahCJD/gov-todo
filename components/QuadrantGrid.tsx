import type { Task } from "@/lib/types";
import { useTaskStore } from "@/stores/task-store";
import { QuadrantCard } from "@/components/QuadrantCard";

interface QuadrantGridProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onAddToQuadrant: (quadrant: number) => void;
}

/** 四象限 2×2 网格 */
export function QuadrantGrid({
  tasks,
  onEdit,
  onAddToQuadrant,
}: QuadrantGridProps) {
  const handleDragStart = (_e: React.DragEvent, _task: Task) => {
    // 拖拽即可；drop 在 QuadrantCard 中处理
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <QuadrantCard
        quadrant={0}
        tasks={tasks}
        onEdit={onEdit}
        onAdd={() => onAddToQuadrant(0)}
        onDragStart={handleDragStart}
      />
      <QuadrantCard
        quadrant={2}
        tasks={tasks}
        onEdit={onEdit}
        onAdd={() => onAddToQuadrant(2)}
        onDragStart={handleDragStart}
      />
      <QuadrantCard
        quadrant={1}
        tasks={tasks}
        onEdit={onEdit}
        onAdd={() => onAddToQuadrant(1)}
        onDragStart={handleDragStart}
      />
      <QuadrantCard
        quadrant={3}
        tasks={tasks}
        onEdit={onEdit}
        onAdd={() => onAddToQuadrant(3)}
        onDragStart={handleDragStart}
      />
    </div>
  );
}
