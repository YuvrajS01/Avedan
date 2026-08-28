import { useEffect, useState } from 'react'
import {
  getNamingTemplate,
  setNamingTemplate,
  renderFileName,
  NAMING_TEMPLATE_DEFAULT,
} from '../domain/naming/fileNaming'

interface FileNamingFieldProps {
  presetId?: string
  onChange?: (template: string) => void
}

export function FileNamingField({ presetId, onChange }: FileNamingFieldProps) {
  const [template, setTemplate] = useState(() => getNamingTemplate(presetId))

  useEffect(() => {
    setTemplate(getNamingTemplate(presetId))
  }, [presetId])

  const handleChange = (value: string) => {
    setTemplate(value)
    setNamingTemplate(presetId, value)
    onChange?.(value)
  }

  const preview = renderFileName(template || NAMING_TEMPLATE_DEFAULT, {
    original: 'rahul',
    index: 1,
    kind: 'photo',
    preset: presetId ?? 'manual',
    ext: 'jpg',
  })

  return (
    <details className="advanced-fields">
      <summary>File naming</summary>
      <label className="field">
        <span>Template</span>
        <input
          type="text"
          value={template}
          placeholder={NAMING_TEMPLATE_DEFAULT}
          onChange={(event) => handleChange(event.target.value)}
          aria-label="File naming template"
        />
      </label>
      <p className="profile-note">
        Tokens: <code>{'{original}'}</code> <code>{'{index}'}</code> <code>{'{kind}'}</code> <code>{'{preset}'}</code>{' '}
        <code>{'{ext}'}</code> — e.g. <code>{'{original}_{index}'}</code> → <code>{preview}</code>
      </p>
      <p className="profile-note">
        Default: <code>{NAMING_TEMPLATE_DEFAULT}.{'{ext}'}</code> → <code>rahul-avedan.jpg</code>. Leave empty to use
        default. Collisions are auto-renamed with <code>-2</code>, <code>-3</code>.
      </p>
    </details>
  )
}
