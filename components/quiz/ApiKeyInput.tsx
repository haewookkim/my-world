'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface ApiKeyInputProps {
  value: string
  onChange: (v: string) => void
}

export function ApiKeyInput({ value, onChange }: ApiKeyInputProps) {
  const [open, setOpen] = useState(false)

  return (
    <Field>
      <FieldLabel htmlFor="api-key">Gemini API 키</FieldLabel>
      <div className="flex gap-2">
        <Input
          id="api-key"
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="AIza..."
          autoComplete="off"
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" type="button">
              도움말
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gemini API 키 발급 방법</DialogTitle>
            </DialogHeader>
            <ol className="flex flex-col gap-3 text-sm list-decimal list-inside">
              <li>
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  aistudio.google.com
                </a>
                에 Google 계정으로 로그인합니다.
              </li>
              <li>
                우측 상단 <strong>Get API Key</strong> 버튼을 클릭합니다.
              </li>
              <li>
                <strong>Create API Key</strong> 버튼을 클릭해 새 키를 생성합니다.
              </li>
              <li>생성된 키를 복사해 위 입력란에 붙여넣습니다.</li>
            </ol>
            <p className="text-muted-foreground text-xs mt-2">
              ⓘ 키는 사용자 브라우저(localStorage)에만 저장되며 서버에 영구 저장되지 않습니다.
            </p>
          </DialogContent>
        </Dialog>
      </div>
    </Field>
  )
}
