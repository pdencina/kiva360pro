'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'

interface Props {
  contenido: string
  onChange: (html: string) => void
}

const VARIABLES = [
  { key: 'nombre_alumno', label: 'Nombre alumno' },
  { key: 'apellido_alumno', label: 'Apellido alumno' },
  { key: 'rut_alumno', label: 'RUT alumno' },
  { key: 'curso_alumno', label: 'Curso/programa' },
  { key: 'nombre_apoderado', label: 'Nombre apoderado' },
  { key: 'apellido_apoderado', label: 'Apellido apoderado' },
  { key: 'rut_apoderado', label: 'RUT apoderado' },
  { key: 'email_apoderado', label: 'Email apoderado' },
  { key: 'telefono_apoderado', label: 'Teléfono apoderado' },
  { key: 'fecha_hoy', label: 'Fecha actual' },
  { key: 'anio', label: 'Año' },
  { key: 'nombre_institucion', label: 'Institución' },
  { key: 'representante_nombre', label: 'Representante' },
]

export default function EditorContrato({ contenido, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Escribe el contrato aquí...' }),
    ],
    content: contenido,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] px-6 py-4',
      },
    },
  })

  if (!editor) return null

  function insertVariable(key: string) {
    editor?.chain().focus().insertContent(`{{${key}}}`).run()
  }

  return (
    <div className="border border-[var(--ar-border)] rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-[var(--ar-border)] bg-[#f9f7f5]">
        {/* Format buttons */}
        <ToolBtn
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          icon="ti-bold" title="Negrita"
        />
        <ToolBtn
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          icon="ti-italic" title="Cursiva"
        />
        <ToolBtn
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          icon="ti-underline" title="Subrayado"
        />
        <div className="w-px h-5 bg-[var(--ar-border)] mx-1" />
        <ToolBtn
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          label="H1" title="Título"
        />
        <ToolBtn
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          label="H2" title="Subtítulo"
        />
        <div className="w-px h-5 bg-[var(--ar-border)] mx-1" />
        <ToolBtn
          active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          icon="ti-align-left" title="Izquierda"
        />
        <ToolBtn
          active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          icon="ti-align-center" title="Centro"
        />
        <ToolBtn
          active={editor.isActive({ textAlign: 'justify' })}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          icon="ti-align-justified" title="Justificado"
        />
        <div className="w-px h-5 bg-[var(--ar-border)] mx-1" />
        <ToolBtn
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          icon="ti-list" title="Lista"
        />
        <ToolBtn
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          icon="ti-list-numbers" title="Lista numerada"
        />
        <div className="w-px h-5 bg-[var(--ar-border)] mx-1" />
        <ToolBtn
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          icon="ti-separator" title="Línea separadora"
        />
      </div>

      {/* Variable insert bar */}
      <div className="px-3 py-2 border-b border-[var(--ar-border)] bg-[#fefcfa]">
        <div className="text-[9px] font-bold text-[var(--ar-muted)] uppercase tracking-wider mb-1.5">
          Insertar dato del alumno/apoderado:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {VARIABLES.map(v => (
            <button
              key={v.key}
              type="button"
              onClick={() => insertVariable(v.key)}
              className="text-[10px] px-2 py-1 rounded-md bg-white border border-[var(--ar-border)] text-[var(--ar-text)] hover:border-[#5B3E9E] hover:bg-[#f3f0f9] hover:text-[#5B3E9E] transition-all font-medium"
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  )
}

function ToolBtn({ active, onClick, icon, label, title }: { active?: boolean; onClick: () => void; icon?: string; label?: string; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-7 h-7 rounded flex items-center justify-center text-[12px] transition-all ${
        active ? 'bg-[#2D1B69] text-white' : 'text-[var(--ar-muted)] hover:bg-white hover:text-[var(--ar-text)]'
      }`}
    >
      {icon ? <i className={`ti ${icon}`} aria-hidden="true"/> : <span className="text-[10px] font-bold">{label}</span>}
    </button>
  )
}
