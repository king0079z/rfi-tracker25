import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

interface Evaluator {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Evaluation {
  evaluator: Evaluator;
  overallScore: number;
  experienceScore: number;
  experienceRemark?: string;
  caseStudiesScore: number;
  caseStudiesRemark?: string;
  domainExperienceScore: number;
  domainExperienceRemark?: string;
  approachAlignmentScore: number;
  approachAlignmentRemark?: string;
  understandingChallengesScore: number;
  understandingChallengesRemark?: string;
  solutionTailoringScore: number;
  solutionTailoringRemark?: string;
  strategyAlignmentScore: number;
  strategyAlignmentRemark?: string;
  methodologyScore: number;
  methodologyRemark?: string;
  innovativeStrategiesScore: number;
  innovativeStrategiesRemark?: string;
  stakeholderEngagementScore: number;
  stakeholderEngagementRemark?: string;
  toolsFrameworkScore: number;
  toolsFrameworkRemark?: string;
  costStructureScore: number;
  costStructureRemark?: string;
  costEffectivenessScore: number;
  costEffectivenessRemark?: string;
  roiScore: number;
  roiRemark?: string;
  referencesScore: number;
  referencesRemark?: string;
  testimonialsScore: number;
  testimonialsRemark?: string;
  sustainabilityScore: number;
  sustainabilityRemark?: string;
  deliverablesScore: number;
  deliverablesRemark?: string;
}

interface PrintableReportProps {
  isOpen: boolean;
  onClose: () => void;
  vendorName: string;
  evaluations: Evaluation[];
}

const criteriaStructure = [
  {
    name: '1. Relevance and Quality of Experience',
    weight: '25%',
    subcriteria: [
      { key: 'experience', name: 'Evidence of experience in AI & Data strategy development and broadcast & Media technology transformation, specifically within the media and broadcasting sector', weight: '10%' },
      { key: 'caseStudies', name: 'Case studies or examples of similar transformation initiatives, with a focus on outcomes such as SMPTE ST2110 adoption, news production workflows, and hybrid infrastructure implementations', weight: '10%' },
      { key: 'domainExperience', name: 'Experience in applying AI to enhance content workflows, operational efficiency, and audience engagement across linear and digital platforms', weight: '5%' }
    ]
  },
  {
    name: '2. Understanding of Project Objectives',
    weight: '20%',
    subcriteria: [
      { key: 'approachAlignment', name: 'Description of how the proposed approach aligns with AJMN\'s mission and objectives for the Technology Transformation Strategy', weight: '7%' },
      { key: 'understandingChallenges', name: 'Demonstrated understanding of AJMN\'s challenges and strategic goals, particularly in transitioning to IP-based architecture and embedding AI solutions across the media value chain', weight: '7%' },
      { key: 'solutionTailoring', name: 'Ability to tailor solutions to address AJMN\'s specific operational and strategic needs', weight: '6%' }
    ]
  },
  {
    name: '3. Proposed Approach and Methodology',
    weight: '26%',
    subcriteria: [
      { key: 'strategyAlignment', name: 'Description of how the proposed approach aligns with AJMN\'s mission and objectives for the Technology Transformation Strategy', weight: '7%' },
      { key: 'methodology', name: 'Detailed methodology for delivering the required services, including high-level timelines, milestones, and key deliverables for each phase of the transformation', weight: '6%' },
      { key: 'innovativeStrategies', name: 'Innovative strategies for cloud integration, AI implementation, workflow optimization, and change management tailored to AJMN\'s operations', weight: '5%' },
      { key: 'stakeholderEngagement', name: 'Mechanisms for stakeholder engagement, risk management, and ensuring cybersecurity and compliance', weight: '5%' },
      { key: 'toolsFramework', name: 'Overview of tools, frameworks, and methodologies used in similar engagements', weight: '3%' }
    ]
  },
  {
    name: '4. Cost and Value for Money',
    weight: '14%',
    subcriteria: [
      { key: 'costStructure', name: 'Preliminary cost structure, breaking down estimated costs for each phase of the transformation and associated deliverables', weight: '6%' },
      { key: 'costEffectiveness', name: 'Cost-effectiveness, including approaches to reusing existing infrastructure and leveraging hybrid models to optimize resource utilization', weight: '5%' },
      { key: 'roi', name: 'Insights into the anticipated return on investment (ROI) and value derived from proposed solutions', weight: '3%' }
    ]
  },
  {
    name: '5. References and Testimonials',
    weight: '10%',
    subcriteria: [
      { key: 'references', name: 'At least two references from a comparable engagement, with contact details for verification', weight: '6%' },
      { key: 'testimonials', name: 'Testimonials or case studies from previous projects that demonstrate the quality and impact of the respondent\'s work', weight: '2%' },
      { key: 'sustainability', name: 'Evidence of the ability to deliver sustainable outcomes and build long-term partnerships', weight: '2%' }
    ]
  },
  {
    name: '6. Deliverable Completeness',
    weight: '5%',
    subcriteria: [
      { key: 'deliverables', name: 'All requested deliverables stipulated in the scope are submitted', weight: '5%' }
    ]
  }
];

export function PrintableReport({ isOpen, onClose, vendorName, evaluations }: PrintableReportProps) {
  const handlePrint = () => {
    const printContent = document.getElementById('printable-content');
    if (printContent) {
      const printWindow = window.open('', '_blank', 'width=1200,height=800');
      if (printWindow) {
        const styles = `
          /* Reset and base styles */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            forced-color-adjust: exact !important;
          }

          /* Print-specific styles */
          @media print {
            html, body {
              width: 210mm;
              height: 297mm;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              forced-color-adjust: exact !important;
              background: white !important;
            }

            body {
              padding: 20mm !important;
            }

            @page {
              size: A4;
              margin: 20mm;
            }

            /* Force background colors in print */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }

            /* Hide scroll areas and dialog elements in print */
            .scroll-area, .dialog {
              overflow: visible !important;
              height: auto !important;
            }

            /* Ensure progress bars print correctly */
            .progress {
              border: 1px solid #e2e8f0 !important;
              background-color: #f1f5f9 !important;
              print-color-adjust: exact !important;
            }

            .progress-value {
              background-color: #2563eb !important;
              print-color-adjust: exact !important;
            }

            /* Ensure proper page breaks */
            .page-break {
              page-break-before: always;
              margin-top: 1cm;
            }

            /* Prevent unwanted breaks */
            .no-break {
              page-break-inside: avoid;
            }

            /* Hide UI elements not needed in print */
            .print-hide {
              display: none !important;
            }
          }
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          @page {
            size: A4;
            margin: 2cm;
            counter-increment: page;
            @bottom-right {
              content: "Page " counter(page);
              font-size: 10pt;
              font-family: system-ui, -apple-system, sans-serif;
              color: #1e293b;
            }
            @top-center {
              content: url('https://assets.co.dev/8534d796-2c06-4014-b778-f937f13f4822/image-3f7c569.png');
              height: 30px;
              margin-bottom: 1cm;
            }
            @top-right {
              content: "Al Jazeera Media Network";
              font-size: 10pt;
              font-family: system-ui, -apple-system, sans-serif;
              color: #1e293b;
            }
            @top-left {
              content: "Vendor Evaluation Report";
              font-size: 10pt;
              font-family: system-ui, -apple-system, sans-serif;
              color: #1e293b;
            }
          }

          /* Force color printing */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            forced-color-adjust: exact !important;
          }

          /* Watermark */
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 80px;
            opacity: 0.05;
            pointer-events: none;
            z-index: 1000;
            white-space: nowrap;
            font-family: system-ui, -apple-system, sans-serif;
            color: #1e293b;
            font-weight: bold;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1.5rem;
            break-inside: avoid;
          }
          
          th, td {
            border: 1px solid #e5e5e5;
            padding: 0.75rem;
            text-align: left;
          }
          
          th {
            background-color: #f1f5f9 !important;
            font-weight: 600;
            color: #1a1a1a;
          }
          
          tr:nth-child(even) {
            background-color: #f8fafc !important;
          }
          
          tr:hover {
            background-color: #f1f5f9 !important;
          }
          
          .total-row {
            background-color: #f1f5f9 !important;
            font-weight: 600;
          }
          
          @media print {
            html {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              forced-color-adjust: exact !important;
            }
          }
          
          html, body {
            margin: 0;
            padding: 0;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.5;
            background-color: white;
            color: #1a1a1a;
          }

          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #printable-content {
            padding: 0;
            max-width: 100%;
            margin: 0 auto;
          }

          .page-break {
            page-break-before: always;
            margin-top: 2cm;
          }

          .header {
            text-align: center;
            margin-bottom: 2cm;
            padding-bottom: 1cm;
            border-bottom: 2px solid #2563eb;
            position: relative;
          }

          .header::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 0;
            width: 100%;
            height: 1px;
            background-color: #2563eb;
            opacity: 0.5;
          }

          .header h1 {
            font-size: 32px;
            margin: 0 0 15px 0;
            color: #1a1a1a;
            font-weight: 700;
            letter-spacing: -0.5px;
          }

          .header h2 {
            font-size: 26px;
            margin: 0 0 15px 0;
            color: #2563eb;
            font-weight: 600;
          }

          .header p {
            font-size: 14px;
            color: #64748b;
            font-weight: 500;
          }

          .card {
            border: 1px solid #e5e5e5;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
            background-color: #ffffff !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            break-inside: avoid;
          }

          .criteria-header {
            background-color: #f1f5f9 !important;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 6px;
            border: 1px solid #e5e5e5;
          }

          .progress {
            position: relative;
            width: 100%;
            height: 16px !important;
            background-color: #f1f5f9 !important;
            border-radius: 8px !important;
            overflow: hidden;
            margin: 10px 0;
            border: 2px solid #e2e8f0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          .progress-value {
            position: absolute;
            height: 100%;
            background: #2563eb !important;
            border-radius: 6px;
            transition: width 0.3s ease;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2) !important;
          }

          .score-box {
            display: inline-block;
            padding: 6px 12px;
            background-color: #f1f5f9 !important;
            border-radius: 6px;
            margin-left: 10px;
            font-weight: 600;
          }

          .comments-section {
            margin-top: 15px;
            padding-left: 15px;
            border-left: 3px solid #e5e5e5;
          }

          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }

          .bg-muted {
            background-color: #f1f5f9 !important;
          }

          .text-muted-foreground {
            color: #64748b;
          }

          .font-semibold {
            font-weight: 600;
          }

          .text-sm { font-size: 14px; }
          .text-lg { font-size: 18px; }
          .text-xl { font-size: 20px; }
          .text-2xl { font-size: 24px; }
          .text-3xl { font-size: 30px; }

          .mb-1 { margin-bottom: 0.25rem; }
          .mb-2 { margin-bottom: 0.5rem; }
          .mb-3 { margin-bottom: 0.75rem; }
          .mb-4 { margin-bottom: 1rem; }
          .mb-6 { margin-bottom: 1.5rem; }
          .mb-8 { margin-bottom: 2rem; }

          .p-4 { padding: 1rem; }
          .p-6 { padding: 1.5rem; }

          .rounded-lg { border-radius: 0.5rem; }

          .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
          .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }

          .separator {
            height: 1px;
            background-color: #e5e5e5;
            margin: 20px 0;
          }

          @media print {
            body {
              width: 210mm;
              height: 297mm;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              forced-color-adjust: exact !important;
            }
            
            .progress, .progress-value {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              forced-color-adjust: exact !important;
            }
            
            .bg-muted, .criteria-header, .score-box {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              forced-color-adjust: exact !important;
              background-color: #f1f5f9 !important;
            }
            
            .progress {
              background-color: #e5e5e5 !important;
            }
            
            .progress-value {
              background-color: #2563eb !important;
            }
            
            * {
              color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              forced-color-adjust: exact !important;
            }
          }
        `;

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Evaluation Report - ${vendorName}</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>${styles}</style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        
        printWindow.document.close();
        
        // Wait for styles and content to be properly loaded
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    }
  };

  const calculateAverageScore = (key: string) => {
    const scores = evaluations.map(e => e[`${key}Score` as keyof Evaluation] as number);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const getRemarks = (key: string) => {
    return evaluations
      .map(e => {
        const remark = e[`${key}Remark` as keyof Evaluation];
        const evaluatorName = e.evaluator.name || e.evaluator.email;
        return remark ? `${evaluatorName}: ${remark}` : null;
      })
      .filter(Boolean);
  };

  const calculateCriteriaGroupScore = (criteria: any) => {
    const scores = criteria.subcriteria.map((sub: any) => {
      const avgScore = calculateAverageScore(sub.key);
      const weight = parseFloat(sub.weight) / 100;
      return avgScore * weight;
    });
    return scores.reduce((a: number, b: number) => a + b, 0);
  };

  const overallAverage = evaluations.reduce((acc, curr) => acc + curr.overallScore, 0) / evaluations.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Evaluation Report - {vendorName}</DialogTitle>
          <Button onClick={handlePrint} className="absolute right-8 top-8">
            Print Report
          </Button>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-120px)]">
          <div id="printable-content" className="p-6">
            <div className="watermark">CONFIDENTIAL</div>
            <div className="header">
              <h1 className="text-3xl font-bold">Vendor Evaluation Report</h1>
              <h2 className="text-2xl text-muted-foreground">{vendorName}</h2>
              <p className="text-sm text-muted-foreground">
                Generated on {new Date().toLocaleDateString()}
              </p>
            </div>

            <Card className="mb-8 p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-6">Executive Summary</h3>
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Total Evaluators</p>
                  <p className="text-2xl font-bold">{evaluations.length}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Overall Score</p>
                  <p className="text-2xl font-bold">{overallAverage.toFixed(2)}%</p>
                  <Progress value={overallAverage} className="h-2 mt-2" />
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Evaluation Status</p>
                  <p className="text-2xl font-bold text-green-600">Complete</p>
                </div>
              </div>
              
              <div className="mb-8 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-4">Key Highlights</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Strongest Areas:</p>
                    {criteriaStructure
                      .map(criteria => ({
                        name: criteria.name,
                        score: calculateCriteriaGroupScore(criteria)
                      }))
                      .sort((a, b) => b.score - a.score)
                      .slice(0, 2)
                      .map((criteria, index) => (
                        <p key={index} className="text-sm text-muted-foreground mt-1">
                          • {criteria.name.split('.')[1].trim()} ({criteria.score.toFixed(2)}%)
                        </p>
                      ))
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium">Areas for Review:</p>
                    {criteriaStructure
                      .map(criteria => ({
                        name: criteria.name,
                        score: calculateCriteriaGroupScore(criteria)
                      }))
                      .sort((a, b) => a.score - b.score)
                      .slice(0, 2)
                      .map((criteria, index) => (
                        <p key={index} className="text-sm text-muted-foreground mt-1">
                          • {criteria.name.split('.')[1].trim()} ({criteria.score.toFixed(2)}%)
                        </p>
                      ))
                    }
                  </div>
                </div>
              </div>
              
              <h4 className="font-semibold mb-4">Evaluation Criteria Summary</h4>
              <table className="w-full border-collapse mb-6">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-3 text-left">Evaluation Criteria</th>
                    <th className="border p-3 text-center w-[120px]">Weight</th>
                    <th className="border p-3 text-center w-[120px]">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {criteriaStructure.map((criteria, index) => {
                    const groupScore = calculateCriteriaGroupScore(criteria);
                    return (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-muted/30'}>
                        <td className="border p-3 font-medium">{criteria.name}</td>
                        <td className="border p-3 text-center">{criteria.weight}</td>
                        <td className="border p-3 text-center font-semibold">{groupScore.toFixed(2)}%</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-muted font-semibold">
                    <td className="border p-3">Total</td>
                    <td className="border p-3 text-center">100%</td>
                    <td className="border p-3 text-center">{overallAverage.toFixed(2)}%</td>
                  </tr>
                </tbody>
              </table>

              <div className="space-y-4">
                {criteriaStructure.map((criteria, index) => {
                  const groupScore = calculateCriteriaGroupScore(criteria);
                  return (
                    <div key={index} className="criteria-summary p-4 rounded-lg border">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-medium">{criteria.name}</p>
                          <p className="text-sm text-muted-foreground">Weight: {criteria.weight}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">{groupScore.toFixed(2)}%</p>
                        </div>
                      </div>
                      <Progress value={groupScore} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </Card>

            <div className="page-break"></div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-6">Evaluator Assessments</h3>
              <div className="grid gap-4">
                {evaluations.map((evaluation, index) => (
                  <Card key={index} className="p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="font-semibold text-lg">{evaluation.evaluator.name || 'Anonymous'}</p>
                        <p className="text-sm text-muted-foreground">{evaluation.evaluator.role}</p>
                        <p className="text-sm text-muted-foreground">{evaluation.evaluator.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Individual Score</p>
                        <p className="text-xl font-bold">{evaluation.overallScore.toFixed(2)}%</p>
                      </div>
                    </div>
                    <Progress value={evaluation.overallScore} className="h-2" />
                  </Card>
                ))}
              </div>
            </div>

            <div className="page-break"></div>

            {criteriaStructure.map((criteria, index) => (
              <div key={index} className="mb-8">
                <div className="criteria-header bg-muted p-6 rounded-lg mb-6">
                  <h3 className="text-xl font-semibold flex items-center justify-between">
                    <span>{criteria.name}</span>
                    <span className="text-sm text-muted-foreground">Weight: {criteria.weight}</span>
                  </h3>
                </div>
                <Card className="p-6 shadow-lg">
                  {criteria.subcriteria.map((sub, subIndex) => {
                    const avgScore = calculateAverageScore(sub.key);
                    const remarks = getRemarks(sub.key);

                    return (
                      <div key={subIndex} className="mb-6 last:mb-0">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex-1">
                            <p className="font-medium mb-1">{sub.name}</p>
                            <p className="text-sm text-muted-foreground">Weight: {sub.weight}</p>
                          </div>
                          <div className="score-box bg-muted ml-4">
                            <span className="font-semibold">{avgScore.toFixed(2)}</span>
                            <span className="text-sm text-muted-foreground">/10</span>
                          </div>
                        </div>
                        <Progress value={avgScore * 10} className="h-2 mb-3" />
                        {evaluations.length > 0 && (
                          <div className="comments-section mt-4 pl-4">
                            <p className="text-sm font-medium mb-2">Individual Evaluations:</p>
                            {evaluations.map((evaluation, i) => {
                              const score = evaluation[`${sub.key}Score` as keyof Evaluation] as number;
                              const remark = evaluation[`${sub.key}Remark` as keyof Evaluation];
                              if (!remark) return null;
                              return (
                                <div key={i} className="mb-3 p-3 bg-muted/30 rounded-lg">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium">{evaluation.evaluator.name || evaluation.evaluator.email}</span>
                                    <span className="text-sm font-semibold bg-muted px-2 py-1 rounded">Score: {score}/10</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{remark}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {subIndex < criteria.subcriteria.length - 1 && (
                          <Separator className="my-6" />
                        )}
                      </div>
                    );
                  })}
                </Card>
                {index < criteriaStructure.length - 1 && <div className="page-break"></div>}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}