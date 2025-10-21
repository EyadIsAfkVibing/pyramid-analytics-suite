import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { generateInsights, Insights as InsightsType } from '@/lib/aiInsights';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Insights = () => {
  const [insights, setInsights] = useState<InsightsType | null>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    const production = await db.production.toArray();
    const inventory = await db.inventory.toArray();
    const sales = await db.sales.toArray();
    const workers = await db.workers.toArray();

    const generatedInsights = generateInsights(production, inventory, sales, workers);
    setInsights(generatedInsights);
    setLoading(false);
  };

  useEffect(() => {
    generateReport();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    const colors = {
      low: 'bg-success text-success-foreground',
      medium: 'bg-accent text-accent-foreground',
      high: 'bg-destructive text-destructive-foreground'
    };
    return colors[difficulty as keyof typeof colors] || '';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">AI Insights & Recommendations</h1>
          <p className="text-muted-foreground">Automated analysis of factory operations</p>
        </div>
        <Button onClick={generateReport} disabled={loading} className="gap-2">
          <Lightbulb className="h-4 w-4" />
          {loading ? 'Analyzing...' : 'Refresh Insights'}
        </Button>
      </div>

      {insights && (
        <>
          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Executive Summary</AlertTitle>
              <AlertDescription>{insights.summary}</AlertDescription>
            </Alert>
          </motion.div>

          {/* Anomalies */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Detected Anomalies ({insights.anomalies.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {insights.anomalies.length === 0 ? (
                  <p className="text-muted-foreground">No anomalies detected. All systems operating normally.</p>
                ) : (
                  insights.anomalies.map((anomaly, index) => (
                    <div key={index} className="border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-lg">{anomaly.issue}</h3>
                        <Badge variant={getSeverityColor(anomaly.severity)}>
                          {anomaly.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Evidence:</span>
                          <p className="text-sm mt-1">{anomaly.evidence}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Likely Causes:</span>
                          <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                            {anomaly.likelyCauses.map((cause, i) => (
                              <li key={i}>{cause}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-accent/10 p-3 rounded-md border-l-4 border-accent">
                          <span className="text-sm font-semibold">Immediate Action:</span>
                          <p className="text-sm mt-1">{anomaly.immediateAction}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Forecasts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Forecasts & Predictions ({insights.forecasts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights.forecasts.length === 0 ? (
                  <p className="text-muted-foreground">No critical forecasts at this time.</p>
                ) : (
                  insights.forecasts.map((forecast, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{forecast.item}</p>
                          {forecast.type === 'inventory' && (
                            <p className="text-sm text-muted-foreground">
                              Estimated depletion in {forecast.daysToDepletion} days
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {(forecast.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-accent" />
                  Recommended Actions ({insights.recommendations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights.recommendations.map((rec, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold">{rec.action}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{rec.estimatedImpact}</p>
                      </div>
                      <Badge className={getDifficultyBadge(rec.difficulty)}>
                        {rec.difficulty} difficulty
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Priority: {rec.priority}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default Insights;
