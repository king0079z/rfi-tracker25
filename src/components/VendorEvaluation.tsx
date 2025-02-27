import React, { useState, useEffect, useCallback } from 'react'
import { useDebounce } from 'use-debounce'
import { AutoSaveIndicator } from './AutoSaveIndicator'
import { toast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Progress } from '@/components/ui/progress'
import { calculateWeightedScore, type EvaluationScores } from '@/lib/calculateScore'
import { VendorEvaluationSummary } from './VendorEvaluationSummary'
import { DetailedEvaluationResults } from './DetailedEvaluationResults'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VendorChat } from './VendorChat'
import { VendorActions } from './VendorActions'

interface VendorEvaluationProps {
  vendorId: number
  vendorName: string
  scopes?: string[]
  onEvaluationSubmitted?: () => void
}

interface Evaluation extends EvaluationScores {
  [key: string]: any
  experienceRemark?: string
  caseStudiesRemark?: string
  domainExperienceRemark?: string
  approachAlignmentRemark?: string
  understandingChallengesRemark?: string
  solutionTailoringRemark?: string
  strategyAlignmentRemark?: string
  methodologyRemark?: string
  innovativeStrategiesRemark?: string
  stakeholderEngagementRemark?: string
  toolsFrameworkRemark?: string
  costStructureRemark?: string
  costEffectivenessRemark?: string
  roiRemark?: string
  referencesRemark?: string
  testimonialsRemark?: string
  sustainabilityRemark?: string
  deliverablesRemark?: string
}

const emptyEvaluation: Evaluation = {
  experienceScore: 0,
  caseStudiesScore: 0,
  domainExperienceScore: 0,
  approachAlignmentScore: 0,
  understandingChallengesScore: 0,
  solutionTailoringScore: 0,
  strategyAlignmentScore: 0,
  methodologyScore: 0,
  innovativeStrategiesScore: 0,
  stakeholderEngagementScore: 0,
  toolsFrameworkScore: 0,
  costStructureScore: 0,
  costEffectivenessScore: 0,
  roiScore: 0,
  referencesScore: 0,
  testimonialsScore: 0,
  sustainabilityScore: 0,
  deliverablesScore: 0,
}

export function VendorEvaluation({ vendorId, vendorName, scopes, onEvaluationSubmitted }: VendorEvaluationProps) {
  const [showResults, setShowResults] = useState(false)
  const [newEvaluation, setNewEvaluation] = useState<Evaluation>(emptyEvaluation)
  const [allEvaluations, setAllEvaluations] = useState<any[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [currentEvaluator, setCurrentEvaluator] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<string>('summary')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [vendor, setVendor] = useState<any>(null)
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error' | 'offline'>('saved')
  const [lastSaved, setLastSaved] = useState<Date | undefined>(undefined)
  const [debouncedEvaluation] = useDebounce(newEvaluation, 2000)

  // Auto-save functionality with force option
  const autoSave = useCallback(async (evaluation: Evaluation, force: boolean = false) => {
    if ((isSubmitted && !force) || !currentEvaluator) return

    try {
      setSaveStatus('saving')
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No authentication token')

      const response = await fetch('/api/evaluations/autosave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          vendorId,
          evaluationData: evaluation,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to auto-save')
      }

      setLastSaved(new Date())
      setSaveStatus('saved')
      
      // Store in localStorage as backup
      localStorage.setItem(`evaluation-draft-${vendorId}`, JSON.stringify({
        evaluation,
        timestamp: new Date().toISOString(),
      }))
    } catch (error) {
      console.error('Auto-save error:', error)
      setSaveStatus(navigator.onLine ? 'error' : 'offline')
      
      // Store in localStorage as backup even if API fails
      localStorage.setItem(`evaluation-draft-${vendorId}`, JSON.stringify({
        evaluation,
        timestamp: new Date().toISOString(),
      }))
    }
  }, [vendorId, isSubmitted, currentEvaluator])

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      if (saveStatus === 'offline') {
        setSaveStatus('saved')
        // Attempt to save any pending changes
        autoSave(newEvaluation)
      }
    }

    const handleOffline = () => {
      setSaveStatus('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [saveStatus, autoSave, newEvaluation])

  // Auto-save when evaluation changes
  useEffect(() => {
    if (!isSubmitted && debouncedEvaluation !== emptyEvaluation) {
      autoSave(debouncedEvaluation)
    }
  }, [debouncedEvaluation, autoSave, isSubmitted])

  // Load vendor data
  useEffect(() => {
    const loadVendorData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const response = await fetch(`/api/vendors/${vendorId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setVendor(data)
        }
      } catch (error) {
        console.error('Error loading vendor data:', error)
      }
    }

    if (isOpen) {
      loadVendorData()
    }
  }, [vendorId, isOpen])

  // Load existing evaluation from API and local storage
  useEffect(() => {
    const loadEvaluation = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return;

        // Try to load from localStorage draft first
        const savedDraft = localStorage.getItem(`evaluation-draft-${vendorId}`)
        if (savedDraft) {
          const { evaluation, timestamp } = JSON.parse(savedDraft)
          // Only use draft if it's less than 24 hours old
          const draftAge = new Date().getTime() - new Date(timestamp).getTime()
          if (draftAge < 24 * 60 * 60 * 1000) { // 24 hours in milliseconds
            setNewEvaluation(evaluation)
            setLastSaved(new Date(timestamp))
            return // Skip API call if we have a recent draft
          }
        }

        // Try to load from API
        const response = await fetch(`/api/evaluations/${vendorId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const { evaluations, summary } = await response.json()
          if (evaluations && evaluations.length > 0) {
            setAllEvaluations(evaluations)
            
            // For contributors and decision makers, find their own evaluation
            if (currentEvaluator?.role === 'CONTRIBUTOR' || currentEvaluator?.role === 'DECISION_MAKER') {
              const ownEvaluation = evaluations.find((e: any) => e.evaluatorId === currentEvaluator.id)
              if (ownEvaluation) {
                setNewEvaluation(ownEvaluation)
                setIsSubmitted(true)
                localStorage.setItem(`evaluation-${vendorId}`, JSON.stringify(ownEvaluation))
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading evaluation:', error)
        toast({
          title: "Warning",
          description: "Could not load existing evaluation data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen && currentEvaluator) {
      loadEvaluation()
    }
  }, [vendorId, isOpen, currentEvaluator])

  // Save to local storage whenever evaluation changes
  useEffect(() => {
    if (!isSubmitted) {
      localStorage.setItem(`evaluation-${vendorId}`, JSON.stringify(newEvaluation))
    }
  }, [newEvaluation, vendorId, isSubmitted])

  // Get evaluator info from auth token
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]))
        setCurrentEvaluator({
          id: decoded.evaluatorId,
          role: decoded.role
        })
      } catch (error) {
        console.error('Error decoding token:', error)
      }
    }
  }, [])

  const validateEvaluation = () => {
    const scoreFields = [
      'experienceScore', 'caseStudiesScore', 'domainExperienceScore',
      'approachAlignmentScore', 'understandingChallengesScore', 'solutionTailoringScore',
      'strategyAlignmentScore', 'methodologyScore', 'innovativeStrategiesScore',
      'stakeholderEngagementScore', 'toolsFrameworkScore', 'costStructureScore',
      'costEffectivenessScore', 'roiScore', 'referencesScore', 'testimonialsScore',
      'sustainabilityScore', 'deliverablesScore'
    ];

    // Check scores
    const missingScores = scoreFields.filter(field => {
      const score = newEvaluation[field as keyof typeof newEvaluation] as number;
      return typeof score !== 'number' || score < 0 || score > 10;
    });

    if (missingScores.length > 0) {
      throw new Error(`Please provide valid scores (0-10) for all criteria: ${missingScores.join(', ')}`);
    }

    // Check comments
    const remarkFields = scoreFields.map(field => field.replace('Score', 'Remark'));
    const missingRemarks = remarkFields.filter(field => {
      const remark = newEvaluation[field as keyof typeof newEvaluation] as string;
      return !remark || remark.trim().length === 0;
    });

    if (missingRemarks.length > 0) {
      throw new Error(`Please provide comments for all criteria. Missing comments for: ${
        missingRemarks.map(field => field.replace('Remark', '')).join(', ')
      }`);
    }

    return true;
  };

  const handleSubmitEvaluation = async () => {
    try {
      // Validate all required fields first
      validateEvaluation();

      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      if (!vendorId) {
        throw new Error('Vendor ID is missing.');
      }

      const overallScore = calculateWeightedScore(newEvaluation)
      
      // Convert all score fields to numbers
      const scoreFields = [
        'experienceScore', 'caseStudiesScore', 'domainExperienceScore',
        'approachAlignmentScore', 'understandingChallengesScore', 'solutionTailoringScore',
        'strategyAlignmentScore', 'methodologyScore', 'innovativeStrategiesScore',
        'stakeholderEngagementScore', 'toolsFrameworkScore', 'costStructureScore',
        'costEffectivenessScore', 'roiScore', 'referencesScore', 'testimonialsScore',
        'sustainabilityScore', 'deliverablesScore'
      ];

      const evaluationData = {
        ...newEvaluation,
        domain: 'MEDIA',
        overallScore,
        vendorId: Number(vendorId),
        evaluatorId: currentEvaluator.id,
      };

      // Ensure all score fields are numbers
      scoreFields.forEach(field => {
        evaluationData[field] = Number(evaluationData[field]) || 0;
      });

      console.log('Submitting evaluation:', evaluationData);

      const response = await fetch('/api/evaluations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(evaluationData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Failed to submit evaluation')
      }
      
      toast({
        title: "Evaluation Submitted Successfully",
        description: `Overall Score: ${overallScore.toFixed(2)}%`,
        variant: "default",
      })

      setIsSubmitted(true)
      setActiveTab('summary')
      
      // Call the callback to refresh data
      if (onEvaluationSubmitted) {
        onEvaluationSubmitted()
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error)
      toast({
        title: "Error Submitting Evaluation",
        description: error instanceof Error ? error.message : "Failed to submit evaluation. Please ensure all fields are filled correctly.",
        variant: "destructive",
      })
    }
  }

  const renderScoreInput = (label: string, field: keyof typeof emptyEvaluation, weight: string) => {
    const remarkKey = (field as string).replace('Score', 'Remark') as keyof Evaluation
    const score = newEvaluation[field] as number
    const weightValue = parseFloat(weight.replace('%', '')) / 100

    return (
      <div className="space-y-2 p-4 border rounded-lg bg-background">
        <div className="space-y-1">
          <Label className="text-base">{label}</Label>
          <p className="text-sm text-muted-foreground">Weight: {weight} of category</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Input
              type="number"
              min="0"
              max="10"
              value={newEvaluation[field]}
              onChange={(e) =>
                setNewEvaluation({
                  ...newEvaluation,
                  [field]: parseFloat(e.target.value) || 0,
                })
              }
              className="w-24"
              disabled={isSubmitted}
            />
            <span className="text-sm text-muted-foreground">(0-10)</span>
            <Progress value={score * 10} className="flex-1" />
          </div>
          
          <div className="text-sm">
            <span className="font-medium">Weighted Score: </span>
            <span className="text-primary">{((score * weightValue) * 100).toFixed(2)}%</span>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Label className="text-sm">Comments</Label>
            <span className="text-sm text-destructive">*</span>
            <span className="text-sm text-muted-foreground">(required)</span>
          </div>
          <Textarea
            value={newEvaluation[remarkKey] as string || ''}
            onChange={(e) =>
              setNewEvaluation({
                ...newEvaluation,
                [remarkKey]: e.target.value,
              })
            }
            placeholder="Please provide detailed comments to support your evaluation..."
            className={`mt-1 ${!newEvaluation[remarkKey] && !isSubmitted ? 'border-destructive' : ''}`}
            disabled={isSubmitted}
            required
          />
          {!newEvaluation[remarkKey] && !isSubmitted && (
            <p className="text-sm text-destructive mt-1">Comments are required for this criterion</p>
          )}
        </div>
      </div>
    )
  }

  const isAdmin = currentEvaluator?.role === 'ADMIN'
  const isDecisionMaker = currentEvaluator?.role === 'DECISION_MAKER'

  // Handle beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSubmitted && saveStatus === 'saving') {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isSubmitted, saveStatus])

  // Handle dialog close
  const handleDialogClose = async (open: boolean) => {
    if (!open) {
      if (!isSubmitted) {
        // Force save before closing regardless of current save status
        await autoSave(newEvaluation, true)
        toast({
          title: "Evaluation Progress Saved",
          description: "Your evaluation progress has been saved and can be resumed later.",
        })
      }
      // Store current state in localStorage before closing
      localStorage.setItem(`evaluation-draft-${vendorId}`, JSON.stringify({
        evaluation: newEvaluation,
        timestamp: new Date().toISOString(),
      }))
    }
    setIsOpen(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full md:w-auto">
          {isAdmin ? 'View Evaluations' : (isDecisionMaker ? 'Evaluate & View' : 'Evaluate Vendor')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] h-[90vh] overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="flex flex-col gap-2">
                <div>Vendor Evaluation - {vendorName}</div>
                <div className="text-lg font-medium text-primary">
                  {isAdmin ? 'Evaluation Summary' : (isDecisionMaker ? 'Evaluation & Summary' : 'Media Scope Evaluation')}
                </div>
              </DialogTitle>
              <DialogDescription>
                {isAdmin 
                  ? 'Review all submitted evaluations for this vendor'
                  : (isDecisionMaker 
                    ? 'Submit your evaluation and review all submissions' 
                    : 'Review and evaluate the vendor based on different criteria')}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.open('https://portals.aljazeera.net/technology/MediaTransformation/Shared%20Documents/Forms/AllItems.aspx?RootFolder=%2Ftechnology%2FMediaTransformation%2FShared%20Documents%2F0-Vendor%20RFI%20Responses&FolderCTID=0x0120000D06952C1A1DE74D95063957868B3DEB&View=%7B47CD6116-E9A2-409E-BD06-76C15E035DFF%7D', '_blank')}
              >
                View RFI Responses
              </Button>
              {isDecisionMaker && (
                <>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        if (!token) throw new Error('No authentication token found');
                        
                        const response = await fetch(`/api/vendors/${vendorId}/decision`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                          },
                          body: JSON.stringify({ decision: 'REJECTED' }),
                        });
                        
                        if (!response.ok) throw new Error('Failed to update decision');
                        
                        toast({
                          title: "Vendor Rejected",
                          description: "The vendor has been rejected and RFI marked as completed.",
                        });
                        
                        if (onEvaluationSubmitted) {
                          onEvaluationSubmitted();
                        }
                      } catch (error) {
                        console.error('Error updating decision:', error);
                        toast({
                          title: "Error",
                          description: "Failed to update vendor decision",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="default"
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        if (!token) throw new Error('No authentication token found');
                        
                        const response = await fetch(`/api/vendors/${vendorId}/decision`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                          },
                          body: JSON.stringify({ decision: 'ACCEPTED' }),
                        });
                        
                        if (!response.ok) throw new Error('Failed to update decision');
                        
                        toast({
                          title: "Vendor Accepted",
                          description: "The vendor has been accepted and RFI marked as completed.",
                        });
                        
                        if (onEvaluationSubmitted) {
                          onEvaluationSubmitted();
                        }
                      } catch (error) {
                        console.error('Error updating decision:', error);
                        toast({
                          title: "Error",
                          description: "Failed to update vendor decision",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Accept
                  </Button>
                  {vendor?.chatEnabled && (
                    <Button
                      variant="outline"
                      onClick={() => setIsChatOpen(true)}
                    >
                      Chat
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        {isDecisionMaker && (
          <VendorChat
            vendorId={vendorId}
            vendorName={vendorName}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />
        )}

        {isAdmin ? (
          <>
            <div className="flex justify-end mb-4 px-4">
              <DetailedEvaluationResults evaluations={allEvaluations} vendorName={vendorName} />
            </div>
            <VendorEvaluationSummary evaluations={allEvaluations} vendorName={vendorName} />
          </>
        ) : isDecisionMaker ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="summary">View Summary</TabsTrigger>
              <TabsTrigger value="evaluate">Submit Evaluation</TabsTrigger>
            </TabsList>
            <TabsContent value="summary">
              <div className="flex justify-end mb-4">
                <DetailedEvaluationResults evaluations={allEvaluations} vendorName={vendorName} />
              </div>
              <VendorEvaluationSummary evaluations={allEvaluations} vendorName={vendorName} />
            </TabsContent>
            <TabsContent value="evaluate">
              <ScrollArea className="h-[calc(90vh-180px)]">
                <div className="space-y-4 p-4">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Current Evaluation Progress</CardTitle>
                        {!isSubmitted && <AutoSaveIndicator status={saveStatus} lastSaved={lastSaved} />}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-lg">Overall Score</h3>
                          <div className="text-2xl font-bold text-primary">
                            {calculateWeightedScore(newEvaluation).toFixed(2)}%
                          </div>
                        </div>
                        
                        <Progress 
                          value={calculateWeightedScore(newEvaluation)} 
                          className="h-2"
                        />
                        
                            {/* Weight section removed */}
                      </div>
                    </CardContent>
                  </Card>

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="experience">
                      <AccordionTrigger>1. Relevance and Quality of Experience (25%)</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid gap-4">
                          {renderScoreInput('Evidence of experience in AI & Data strategy development and broadcast & Media technology transformation, specifically within the media and broadcasting sector', 'experienceScore', '10%')}
                          {renderScoreInput('Case studies or examples of similar transformation initiatives, with a focus on outcomes such as SMPTE ST2110 adoption, news production workflows, and hybrid infrastructure implementations', 'caseStudiesScore', '10%')}
                          {renderScoreInput('Experience in applying AI to enhance content workflows, operational efficiency, and audience engagement across linear and digital platforms', 'domainExperienceScore', '5%')}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="understanding">
                      <AccordionTrigger>2. Understanding of Project Objectives (20%)</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid gap-4">
                          {renderScoreInput('Description of how the proposed approach aligns with AJMN\'s mission and objectives for the Technology Transformation Strategy', 'approachAlignmentScore', '7%')}
                          {renderScoreInput('Demonstrated understanding of AJMN\'s challenges and strategic goals, particularly in transitioning to IP-based architecture and embedding AI solutions across the media value chain', 'understandingChallengesScore', '7%')}
                          {renderScoreInput('Ability to tailor solutions to address AJMN\'s specific operational and strategic needs', 'solutionTailoringScore', '6%')}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="methodology">
                      <AccordionTrigger>3. Proposed Approach and Methodology (26%)</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid gap-4">
                          {renderScoreInput('Description of how the proposed approach aligns with AJMN\'s mission and objectives for the Technology Transformation Strategy', 'strategyAlignmentScore', '7%')}
                          {renderScoreInput('Detailed methodology for delivering the required services, including high-level timelines, milestones, and key deliverables for each phase of the transformation', 'methodologyScore', '6%')}
                          {renderScoreInput('Innovative strategies for cloud integration, AI implementation, workflow optimization, and change management tailored to AJMN\'s operations', 'innovativeStrategiesScore', '5%')}
                          {renderScoreInput('Mechanisms for stakeholder engagement, risk management, and ensuring cybersecurity and compliance', 'stakeholderEngagementScore', '5%')}
                          {renderScoreInput('Overview of tools, frameworks, and methodologies used in similar engagements', 'toolsFrameworkScore', '3%')}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="cost">
                      <AccordionTrigger>4. Cost and Value for Money (14%)</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid gap-4">
                          {renderScoreInput('Preliminary cost structure, breaking down estimated costs for each phase of the transformation and associated deliverables', 'costStructureScore', '6%')}
                          {renderScoreInput('Cost-effectiveness, including approaches to reusing existing infrastructure and leveraging hybrid models to optimize resource utilization', 'costEffectivenessScore', '5%')}
                          {renderScoreInput('Insights into the anticipated return on investment (ROI) and value derived from proposed solutions', 'roiScore', '3%')}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="references">
                      <AccordionTrigger>5. References and Testimonials (10%)</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid gap-4">
                          {renderScoreInput('At least two references from a comparable engagement, with contact details for verification', 'referencesScore', '6%')}
                          {renderScoreInput('Testimonials or case studies from previous projects that demonstrate the quality and impact of the respondent\'s work', 'testimonialsScore', '2%')}
                          {renderScoreInput('Evidence of the ability to deliver sustainable outcomes and build long-term partnerships', 'sustainabilityScore', '2%')}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="deliverables">
                      <AccordionTrigger>6. Deliverable Completeness (5%)</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid gap-4">
                          {renderScoreInput('All requested deliverables stipulated in the scope are submitted', 'deliverablesScore', '5%')}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {!isSubmitted && (
                    <Button 
                      className="mt-4 w-full" 
                      onClick={handleSubmitEvaluation}
                      size="lg"
                    >
                      Submit Media Evaluation
                    </Button>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <ScrollArea className="h-[calc(90vh-120px)]">
            <div className="space-y-4 p-4">
              <Card>
                <CardHeader>
                  <CardTitle>Current Evaluation Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-lg">Overall Score</h3>
                      <div className="text-2xl font-bold text-primary">
                        {calculateWeightedScore(newEvaluation).toFixed(2)}%
                      </div>
                    </div>
                    
                    <Progress 
                      value={calculateWeightedScore(newEvaluation)} 
                      className="h-2"
                    />
                    
                    <div className="grid gap-2">
                      <div className="flex justify-between text-sm">
                        <span>1. Experience & Quality (25%)</span>
                        <span className="font-medium">{(
                          (newEvaluation.experienceScore / 10 * 0.10 +
                          newEvaluation.caseStudiesScore / 10 * 0.10 +
                          newEvaluation.domainExperienceScore / 10 * 0.05) * 100
                        ).toFixed(2)}%</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>2. Project Understanding (20%)</span>
                        <span className="font-medium">{(
                          (newEvaluation.approachAlignmentScore / 10 * 0.07 +
                          newEvaluation.understandingChallengesScore / 10 * 0.07 +
                          newEvaluation.solutionTailoringScore / 10 * 0.06) * 100
                        ).toFixed(2)}%</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>3. Methodology (26%)</span>
                        <span className="font-medium">{(
                          (newEvaluation.strategyAlignmentScore / 10 * 0.07 +
                          newEvaluation.methodologyScore / 10 * 0.06 +
                          newEvaluation.innovativeStrategiesScore / 10 * 0.05 +
                          newEvaluation.stakeholderEngagementScore / 10 * 0.05 +
                          newEvaluation.toolsFrameworkScore / 10 * 0.03) * 100
                        ).toFixed(2)}%</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>4. Cost & Value (14%)</span>
                        <span className="font-medium">{(
                          (newEvaluation.costStructureScore / 10 * 0.06 +
                          newEvaluation.costEffectivenessScore / 10 * 0.05 +
                          newEvaluation.roiScore / 10 * 0.03) * 100
                        ).toFixed(2)}%</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>5. References (10%)</span>
                        <span className="font-medium">{(
                          (newEvaluation.referencesScore / 10 * 0.06 +
                          newEvaluation.testimonialsScore / 10 * 0.02 +
                          newEvaluation.sustainabilityScore / 10 * 0.02) * 100
                        ).toFixed(2)}%</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>6. Deliverables (5%)</span>
                        <span className="font-medium">{(
                          newEvaluation.deliverablesScore / 10 * 0.05 * 100
                        ).toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="experience">
                  <AccordionTrigger>1. Relevance and Quality of Experience (25%)</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4">
                      {renderScoreInput('Evidence of experience in AI & Data strategy development and broadcast & Media technology transformation, specifically within the media and broadcasting sector', 'experienceScore', '10%')}
                      {renderScoreInput('Case studies or examples of similar transformation initiatives, with a focus on outcomes such as SMPTE ST2110 adoption, news production workflows, and hybrid infrastructure implementations', 'caseStudiesScore', '10%')}
                      {renderScoreInput('Experience in applying AI to enhance content workflows, operational efficiency, and audience engagement across linear and digital platforms', 'domainExperienceScore', '5%')}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="understanding">
                  <AccordionTrigger>2. Understanding of Project Objectives (20%)</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4">
                      {renderScoreInput('Description of how the proposed approach aligns with AJMN\'s mission and objectives for the Technology Transformation Strategy', 'approachAlignmentScore', '7%')}
                      {renderScoreInput('Demonstrated understanding of AJMN\'s challenges and strategic goals, particularly in transitioning to IP-based architecture and embedding AI solutions across the media value chain', 'understandingChallengesScore', '7%')}
                      {renderScoreInput('Ability to tailor solutions to address AJMN\'s specific operational and strategic needs', 'solutionTailoringScore', '6%')}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="methodology">
                  <AccordionTrigger>3. Proposed Approach and Methodology (26%)</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4">
                      {renderScoreInput('Description of how the proposed approach aligns with AJMN\'s mission and objectives for the Technology Transformation Strategy', 'strategyAlignmentScore', '7%')}
                      {renderScoreInput('Detailed methodology for delivering the required services, including high-level timelines, milestones, and key deliverables for each phase of the transformation', 'methodologyScore', '6%')}
                      {renderScoreInput('Innovative strategies for cloud integration, AI implementation, workflow optimization, and change management tailored to AJMN\'s operations', 'innovativeStrategiesScore', '5%')}
                      {renderScoreInput('Mechanisms for stakeholder engagement, risk management, and ensuring cybersecurity and compliance', 'stakeholderEngagementScore', '5%')}
                      {renderScoreInput('Overview of tools, frameworks, and methodologies used in similar engagements', 'toolsFrameworkScore', '3%')}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="cost">
                  <AccordionTrigger>4. Cost and Value for Money (14%)</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4">
                      {renderScoreInput('Preliminary cost structure, breaking down estimated costs for each phase of the transformation and associated deliverables', 'costStructureScore', '6%')}
                      {renderScoreInput('Cost-effectiveness, including approaches to reusing existing infrastructure and leveraging hybrid models to optimize resource utilization', 'costEffectivenessScore', '5%')}
                      {renderScoreInput('Insights into the anticipated return on investment (ROI) and value derived from proposed solutions', 'roiScore', '3%')}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="references">
                  <AccordionTrigger>5. References and Testimonials (10%)</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4">
                      {renderScoreInput('At least two references from a comparable engagement, with contact details for verification', 'referencesScore', '6%')}
                      {renderScoreInput('Testimonials or case studies from previous projects that demonstrate the quality and impact of the respondent\'s work', 'testimonialsScore', '2%')}
                      {renderScoreInput('Evidence of the ability to deliver sustainable outcomes and build long-term partnerships', 'sustainabilityScore', '2%')}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="deliverables">
                  <AccordionTrigger>6. Deliverable Completeness (5%)</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4">
                      {renderScoreInput('Required Documentation', 'deliverablesScore', '5%')}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {!isSubmitted && (
                <Button 
                  className="mt-4 w-full" 
                  onClick={handleSubmitEvaluation}
                  size="lg"
                >
                  Submit Media Evaluation
                </Button>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}