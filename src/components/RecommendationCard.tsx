import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface ActionItem {
  title: string;
  description: string;
  savings?: string;
}

interface RecommendationCardProps {
  icon: LucideIcon;
  title: string;
  category: string;
  summary: string;
  actionItems: ActionItem[];
  color: string;
  bgColor: string;
}

export const RecommendationCard = ({ 
  icon: Icon, 
  title, 
  category, 
  summary, 
  actionItems, 
  color, 
  bgColor 
}: RecommendationCardProps) => {
  return (
    <Card className={`shadow-elegant hover:shadow-luxe transition-all duration-300 border-border/50 bg-gradient-card`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${bgColor}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <Badge variant="outline" className="mt-1">{category}</Badge>
            </div>
          </div>
        </div>
        {summary && (
          <CardDescription className="text-sm mt-3">
            {summary}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actionItems.map((item, index) => (
            <div key={index} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="font-medium text-sm flex items-center gap-2">
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${bgColor} ${color} text-xs font-bold`}>
                      {index + 1}
                    </span>
                    {item.title}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-7">
                    {item.description}
                  </p>
                </div>
                {item.savings && (
                  <Badge variant="secondary" className="shrink-0 bg-success/10 text-success">
                    {item.savings}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
