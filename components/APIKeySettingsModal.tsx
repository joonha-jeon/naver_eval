import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from 'lucide-react'

interface APIKeySettingsModalProps {
 isOpen: boolean;
 onClose: () => void;
 onSave: (keys: APIKeys) => void;
 initialKeys: APIKeys;
}

export interface APIProvider {
 name: string;
 bearerToken: string;
}

export interface APIKeys {
 providers: APIProvider[];
}

export function APIKeySettingsModal({ isOpen, onClose, onSave, initialKeys }: APIKeySettingsModalProps) {
 const [keys, setKeys] = useState<APIKeys>(initialKeys);

 useEffect(() => {
   // Ensure OpenAI is always present
   const updatedKeys = { ...initialKeys };
   if (!updatedKeys.providers.some(provider => provider.name === 'openai')) {
     updatedKeys.providers.unshift({ name: 'openai', bearerToken: '' });
   }
   setKeys(updatedKeys);
 }, [initialKeys])

 const handleSave = () => {
   onSave(keys)
 }

 const addProvider = () => {
   setKeys(prevKeys => ({
     ...prevKeys,
     providers: [...prevKeys.providers, { name: '', bearerToken: '' }]
   }));
 }

 const removeProvider = (index: number) => {
   if (keys.providers[index].name === 'openai') return; // Prevent removing OpenAI
   setKeys(prevKeys => ({
     ...prevKeys,
     providers: prevKeys.providers.filter((_, i) => i !== index)
   }));
 }

 const updateProvider = (index: number, field: 'name' | 'bearerToken', value: string) => {
   setKeys(prevKeys => ({
     ...prevKeys,
     providers: prevKeys.providers.map((provider, i) => 
       i === index ? { ...provider, [field]: value } : provider
     )
   }));
 }

 return (
   <Dialog open={isOpen} onOpenChange={onClose}>
     <DialogContent className="max-w-2xl">
       <DialogHeader>
         <DialogTitle>API 키 설정</DialogTitle>
       </DialogHeader>
       <div className="grid gap-4 py-4">
         {keys.providers.map((provider, index) => (
           <div key={index} className="grid gap-4 border-b pb-4">
             <div className="grid gap-2">
               <Label htmlFor={`providerName-${index}`}>
                 제공사 이름
               </Label>
               <Input
                 id={`providerName-${index}`}
                 value={provider.name}
                 onChange={(e) => updateProvider(index, 'name', e.target.value)}
                 placeholder="API 키 구분을 위한 입력란입니다. ex. openai, anthropic, cohere"
                 disabled={provider.name === 'openai'}
               />
             </div>
             <div className="grid gap-2">
               <Label htmlFor={`bearerToken-${index}`}>
                 Bearer Token
               </Label>
               <Input
                 id={`bearerToken-${index}`}
                 value={provider.bearerToken}
                 onChange={(e) => updateProvider(index, 'bearerToken', e.target.value)}
                 type="text"
                 placeholder="API 제공사에서 발급받은 Bearer Token을 입력하세요. ex. sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
               />
             </div>
             {provider.name !== 'openai' && (
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => removeProvider(index)}
                 className="w-full"
               >
                 <Trash2 className="h-4 w-4 mr-2" />
                 이 제공사 삭제
               </Button>
             )}
           </div>
         ))}
         <Button onClick={addProvider} className="w-full">
           <Plus className="h-4 w-4 mr-2" />
           새 제공사 추가
         </Button>
       </div>
       <DialogFooter>
         <Button onClick={handleSave} className="w-full">저장</Button>
       </DialogFooter>
     </DialogContent>
   </Dialog>
 )
}

