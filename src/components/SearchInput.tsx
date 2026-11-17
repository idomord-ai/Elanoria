import { useId } from 'react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchInput({ value, onChange, placeholder = 'e.g. Valciel' }: SearchInputProps) {
  const id = useId()

  return (
    <div className="search" role="search">
      <label htmlFor={id}>Search by name</label>
      <div className="search__control">
        <span className="search__icon" aria-hidden="true" />
        <input
          id={id}
          type="search"
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>
    </div>
  )
}
