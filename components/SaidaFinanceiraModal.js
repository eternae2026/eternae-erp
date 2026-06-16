import { useState } from 'react'

export default function SaidaFinanceiraModal({
  open,
  onClose,
  onSalvar
}) {
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState('Matéria-prima')
  const [valor, setValor] = useState('')
  const [dataSaida, setDataSaida] = useState('')
  const [observacoes, setObservacoes] = useState('')

  if (!open) return null

  function limparCampos() {
    setDescricao('')
    setCategoria('Matéria-prima')
    setValor('')
    setDataSaida('')
    setObservacoes('')
  }

  async function salvarSaida() {
  if (!descricao) {
    alert('Informe a descrição da saída.')
    return
  }

  if (!valor) {
    alert('Informe o valor da saída.')
    return
  }

  const valorConvertido = Number(
    String(valor).replace(',', '.')
  )

  if (isNaN(valorConvertido)) {
    alert('Informe um valor válido.')
    return
  }

  const salvou = await onSalvar({
    descricao,
    categoria,
    valor: valorConvertido,
    data_saida: dataSaida || new Date().toISOString().slice(0, 10),
    observacoes
  })

  if (salvou) {
    limparCampos()
  }
}

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-xl rounded-2xl p-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Nova Saída
            </h2>

            <p className="text-gray-500">
              Registre uma despesa ou saída financeira.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">

          <input
            type="text"
            placeholder="Descrição"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
          />

          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
          >
            <option value="Matéria-prima">Matéria-prima</option>
            <option value="Embalagens">Embalagens</option>
            <option value="Frete">Frete</option>
            <option value="Marketing">Marketing</option>
            <option value="Canva">Canva</option>
            <option value="Domínio">Domínio</option>
            <option value="Internet">Internet</option>
            <option value="Energia">Energia</option>
            <option value="Equipamentos">Equipamentos</option>
            <option value="Impostos">Impostos</option>
            <option value="Outros">Outros</option>
          </select>

          <input
            type="number"
            placeholder="Valor"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
          />

          <input
            type="date"
            value={dataSaida}
            onChange={(e) => setDataSaida(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
          />

          <textarea
            rows="3"
            placeholder="Observações"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
          />

        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl border"
          >
            Cancelar
          </button>

          <button
            onClick={salvarSaida}
            className="bg-red-600 text-white px-5 py-3 rounded-xl hover:bg-red-700 transition"
          >
            Salvar Saída
          </button>
        </div>

      </div>
    </div>
  )
}