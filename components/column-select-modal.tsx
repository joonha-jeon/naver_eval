import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { APIProvider } from './APIKeySettingsModal'

interface ColumnSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (systemPrompt: string, userInput: string, modelName: string, hostUrl: string, selectedProvider: string) => void
  columns: string[]
  providers: APIProvider[]
}

export function ColumnSelectModal({ isOpen, onClose, onConfirm, columns, providers }: ColumnSelectModalProps) {
  const [systemPrompt, setSystemPrompt] = React.useState<string>('')
  const [userInput, setUserInput] = React.useState<string>('')
  const [modelName, setModelName] = React.useState<string>('')
  const [hostUrl, setHostUrl] = useState<string>('')
  const [selectedProvider, setSelectedProvider] = useState<string>('')

  const handleConfirm = () => {
    onConfirm(
      systemPrompt === "none" ? "" : systemPrompt,
      userInput === "none" ? "" : userInput,
      modelName,
      hostUrl,
      selectedProvider
    )
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>인퍼런스 설정</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="systemPrompt" className="text-right">
              System Prompt
            </Label>
            <Select value={systemPrompt} onValueChange={setSystemPrompt}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {columns.map((column) => (
                  <SelectItem key={column} value={column}>
                    {column}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="userInput" className="text-right">
              User Input
            </Label>
            <Select value={userInput} onValueChange={setUserInput}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {columns.map((column) => (
                  <SelectItem key={column} value={column}>
                    {column}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="modelName" className="text-right">
              Model Name
            </Label>
            <Input
              id="modelName"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="col-span-3"
              placeholder="Enter model name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="hostUrl" className="text-right">
              Host URL
            </Label>
            <Input
              id="hostUrl"
              value={hostUrl}
              onChange={(e) => setHostUrl(e.target.value)}
              className="col-span-3"
              placeholder="https://api.example.com"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="provider" className="text-right">
              API Provider
            </Label>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select API provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.name} value={provider.name}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

