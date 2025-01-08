import { useState, useCallback } from 'react'
import Papa, { ParseResult, ParseConfig } from 'papaparse'

export interface RowData {
 [key: string]: string | number | undefined;
 LLM_Eval?: string;
 Human_Eval?: string;
 is_augmented?: string;
}

interface ColumnType {
 type: 'text' | 'dropdown';
 scoreRange?: number;
}

export function useCSVData() {
 const [data, setData] = useState<RowData[]>([])
 const [headers, setHeaders] = useState<string[]>([])
 const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({})
 const [columnTypes, setColumnTypes] = useState<{[key: string]: ColumnType}>({})

 const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
   const file = event.target.files?.[0]
   if (file) {
     const reader = new FileReader();
     reader.onload = (e) => {
       const csv = e.target?.result;
       if (typeof csv === 'string') {
         try {
           const config: ParseConfig<RowData> = {
             header: true,
             dynamicTyping: true,
             skipEmptyLines: true,
             complete: (results: ParseResult<RowData>) => {
               if (Array.isArray(results.data) && results.data.length > 0) {
                 const parsedHeaders = Object.keys(results.data[0])
                 const newHeaders = [...parsedHeaders, 'LLM_Eval', 'Human_Eval']
                 setHeaders(newHeaders)
                 
                 const parsedData = results.data.map((row) => ({
                   ...row,
                   LLM_Eval: '',
                   Human_Eval: '',
                 }))
                 
                 setData(parsedData)
                 setColumnWidths(Object.fromEntries(newHeaders.map(header => [header, 200])))
                 
                 const defaultColumnTypes = Object.fromEntries(newHeaders.map(header => [
                   header, 
                   header === 'LLM_Eval' || header === 'Human_Eval' 
                     ? { type: 'dropdown' as const, scoreRange: 7 }
                     : { type: 'text' as const }
                 ]))
                 setColumnTypes(defaultColumnTypes)
               } else {
                 console.error('Invalid CSV format')
                 setHeaders([])
                 setData([])
               }
             }
           }
           
           Papa.parse(csv, config)
         } catch (error) {
           console.error('Error parsing CSV:', error)
           setHeaders([])
           setData([])
         }
       }
     };

     reader.onerror = () => {
       console.error('Error reading file')
       setHeaders([])
       setData([])
     }

     reader.readAsText(file)
   }
 }, [])

 const handleCellEdit = useCallback((rowIndex: number, header: string, value: string) => {
   setData(prevData => {
     const newData = [...prevData]
     newData[rowIndex] = { 
       ...newData[rowIndex], 
       [header]: value 
     }
     return newData
   })
 }, [])

 const handleDownload = useCallback(() => {
   const csv = Papa.unparse({
     fields: headers,
     data: data.map(row => headers.map(header => row[header] || ''))
   })
   const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
   const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8;' })
   const url = URL.createObjectURL(blob)
   const link = document.createElement('a')
   link.href = url
   link.setAttribute('download', 'data.csv')
   document.body.appendChild(link)
   link.click()
   document.body.removeChild(link)
   URL.revokeObjectURL(url)
 }, [headers, data])

 return {
   data,
   setData,
   headers,
   setHeaders,
   columnWidths,
   setColumnWidths,
   columnTypes,
   setColumnTypes,
   handleFileUpload,
   handleCellEdit,
   handleDownload
 }
}

