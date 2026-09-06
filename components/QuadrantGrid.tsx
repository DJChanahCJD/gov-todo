import type { Task } from "@/lib/types";
import { QuadrantCard } from "@/components/QuadrantCard";

interface QuadrantGridProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onAddToQuadrant: (quadrant: number) => void;
}

/** 四象限网格：TL=重要紧急 / TR=重要不紧急 / BL=不重要紧急 / BR=不重要不紧急 */
export function QuadrantGrid({
  tasks,
  onEdit,
  onAddToQuadrant,
}: QuadrantGridProps) {
  const handleDragStart = () => {
    // 拖拽即可；drop 在 QuadrantCard 中处理
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-1 grid-rows-4 gap-2 md:grid-cols-2 md:grid-rows-2">
      <QuadrantCard
        quadrant={0}
        tasks={tasks}
        onEdit={onEdit}
        onAdd={() => onAddToQuadrant(0)}
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
        quadrant={2}
        tasks={tasks}
        onEdit={onEdit}
        onAdd={() => onAddToQuadrant(2)}
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
