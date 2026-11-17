import { useId } from 'react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchInput({ value, onChange, placeholder = 'e.g. Valciel' }: SearchInputProps) {
  const id = useId()

  return (
    <div className="search">
      <label htmlFor={id}>Search by name</label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
      />
    </div>
  )
}
