import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { X } from 'lucide-react'

interface LLMEvaluationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (evaluationSettings: EvaluationSettings) => void
  headers: string[]
}

interface EvaluationSettings {
  model: string
  selectedColumns: string[]
  evaluationPrompt: string
  scoreRange: number
  scoreCriteria: { [key: number]: string }
}

const defaultIntroText = `assistant의 응답을 평가하는 작업을 진행합니다. 평가를 진행할 때에는 아래의 '평가기준'을 활용해야 하며, 에이전트의 응답이 몇 점인지 평가하고, 그 근거를 제시해 주세요.`

const defaultEvaluationPrompt = `
Context:
{context}

평가 기준:
{scoreCriteria}

점수와 평가의 근거는 다음과 같이 제시해 주세요.
평가 점수: n/{scoreRange}
- 근거 1: ...
- 근거 2: ...
- 근거 3: ...`

export function LLMEvaluationModal({ isOpen, onClose, onConfirm, headers }: LLMEvaluationModalProps) {
  const [model, setModel] = useState<string>('gpt-3.5-turbo')
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [evaluationPrompt, setEvaluationPrompt] = useState<string>(defaultEvaluationPrompt)
  const [manualPrompt, setManualPrompt] = useState<string>(defaultIntroText)
  const [scoreRange, setScoreRange] = useState<number>(7)
  const [scoreCriteria, setScoreCriteria] = useState<{ [key: number]: string }>({})

  useEffect(() => {
    setScoreCriteria(prevCriteria => {
      const newScoreCriteria: { [key: number]: string } = {}
      for (let i = 1; i <= scoreRange; i++) {
        newScoreCriteria[i] = prevCriteria[i] || ''
      }
      return newScoreCriteria
    })
  }, [scoreRange])

  const updateEvaluationPrompt = useCallback(() => {
    let updatedPrompt = defaultEvaluationPrompt

    if (selectedColumns.length > 0) {
      const columnContext = selectedColumns.map(col => `${col}: {${col}}`).join('\n')
      updatedPrompt = updatedPrompt.replace('{context}', columnContext)
    } else {
      updatedPrompt = updatedPrompt.replace('{context}', '')
    }

    const criteriaText = Object.entries(scoreCriteria)
      .map(([score, criteria]) => `${score}점: ${criteria}`)
      .join('\n')
    updatedPrompt = updatedPrompt.replace('{scoreCriteria}', criteriaText)

    updatedPrompt = updatedPrompt.replace('{scoreRange}', scoreRange.toString())

    setEvaluationPrompt(updatedPrompt)
  }, [selectedColumns, scoreCriteria, scoreRange])

  useEffect(() => {
    updateEvaluationPrompt()
  }, [updateEvaluationPrompt])

  const handleConfirm = useCallback(() => {
    const settings: EvaluationSettings = {
      model,
      selectedColumns,
      evaluationPrompt: manualPrompt + '\n\n' + evaluationPrompt,
      scoreRange,
      scoreCriteria,
    }
    onConfirm(settings)
  }, [model, selectedColumns, manualPrompt, evaluationPrompt, scoreRange, scoreCriteria, onConfirm])

  const handleColumnToggle = (column: string) => {
    setSelectedColumns(prev =>
      prev.includes(column)
        ? prev.filter(col => col !== column)
        : [...prev, column]
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 flex flex-col">
        <div className="flex flex-col h-full">
          <div className="flex-grow overflow-auto">
            <div className="sticky top-0 bg-white z-10 p-6 border-b flex justify-between items-center">
              <DialogHeader>
                <DialogTitle>LLM 평가 설정</DialogTitle>
              </DialogHeader>
              <Button variant="ghost" onClick={onClose} className="w-8 h-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-grow flex overflow-hidden">
              <ScrollArea className="flex-1 p-6 border-r">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="model">평가 모델</Label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger>
                        <SelectValue placeholder="모델 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5-Turbo</SelectItem>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>평가에 포함할 열</Label>
                    <ScrollArea className="h-[150px] border rounded-md p-4 mt-2">
                      {headers.map((header) => (
                        <div key={header} className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={header}
                            checked={selectedColumns.includes(header)}
                            onCheckedChange={() => handleColumnToggle(header)}
                          />
                          <Label htmlFor={header}>{header}</Label>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                  <div>
                    <Label htmlFor="scoreRange">점수 범위</Label>
                    <Select value={scoreRange.toString()} onValueChange={(value) => setScoreRange(Number(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="점수 범위 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {[3, 5, 7, 10].map((range) => (
                          <SelectItem key={range} value={range.toString()}>
                            1-{range}점
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>점수별 평가 기준</Label>
                    <div className="space-y-2 mt-2">
                      {Object.keys(scoreCriteria).map((score) => (
                        <div key={score} className="flex items-center space-x-2">
                          <Label htmlFor={`criteria-${score}`} className="w-12">{score}점:</Label>
                          <Input
                            id={`criteria-${score}`}
                            value={scoreCriteria[Number(score)]}
                            onChange={(e) => setScoreCriteria({ ...scoreCriteria, [score]: e.target.value })}
                            className="flex-grow"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <div className="flex-1 p-6 flex flex-col">
                <Label htmlFor="evaluationPrompt" className="mb-2">평가 프롬프트</Label>
                <div className="flex-grow flex flex-col space-y-2">
                  <Textarea
                    id="manualPrompt"
                    value={manualPrompt}
                    onChange={(e) => setManualPrompt(e.target.value)}
                    className="h-24 min-h-[6rem] resize-none"
                    placeholder="수동 프롬프트 입력"
                  />
                  <Textarea
                    id="evaluationPrompt"
                    value={evaluationPrompt}
                    className="flex-grow bg-gray-100 min-h-[200px]"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 border-t">
            <Button onClick={handleConfirm} className="w-full">평가 실행</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

