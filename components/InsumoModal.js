import { useEffect, useState } from 'react'

export default function InsumoModal({
  open,
  onClose,
  onSave,
  insumo
}) {
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState('')
  const [quantidadeDisponivel, setQuantidadeDisponivel] = useState('')
  const [quantidadeReservada, setQuantidadeReservada] = useState('')
  const [estoqueMinimo, setEstoqueMinimo] = useState('')
  const [unidade, setUnidade] = useState('unidade')
  const [fornecedor, setFornecedor] = useState('')
  const [valorCompra, setValorCompra] = useState('')
  const [quantidadeCompra, setQuantidadeCompra] = useState('1')

  useEffect(() => {
    if (insumo) {
      setNome(insumo.nome || '')
      setCategoria(insumo.categoria || '')
      setQuantidadeDisponivel(insumo.quantidade_disponivel || '')
      setQuantidadeReservada(insumo.quantidade_reservada || '')
      setEstoqueMinimo(insumo.estoque_minimo || '')
      setUnidade(insumo.unidade || 'unidade')
      setFornecedor(insumo.fornecedor || '')
      setValorCompra(insumo.valor_compra || '')
      setQuantidadeCompra(insumo.quantidade_compra || '1')
    } else {
      setNome('')
      setCategoria('')
      setQuantidadeDisponivel('')
      setQuantidadeReservada('')
      setEstoqueMinimo('')
      setUnidade('unidade')
      setFornecedor('')
      setValorCompra('')
      setQuantidadeCompra('1')
    }
  }, [insumo, open])

  if (!open) return null

  function calcularCustoUnitario() {
    const valor = Number(valorCompra || 0)
    const quantidade = Number(quantidadeCompra || 0)

    if (quantidade <= 0) return 0

    return valor / quantidade
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function handleSubmit() {
    if (!nome) {
      alert('Informe o nome do insumo.')
      return
    }

    onSave({
      nome,
      categoria,
      quantidade_disponivel: Number(quantidadeDisponivel || 0),
      quantidade_reservada: Number(quantidadeReservada || 0),
      estoque_minimo: Number(estoqueMinimo || 0),
      unidade,
      fornecedor,
      valor_compra: Number(valorCompra || 0),
      quantidade_compra: Number(quantidadeCompra || 1),
      custo_unitario: calcularCustoUnitario()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-3xl rounded-2xl p-8 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {insumo ? 'Editar Insumo' : 'Novo Insumo'}
          </h2>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">

          <input
            type="text"
            placeholder="Nome do insumo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="border rounded-xl px-4 py-3"
          />

          <input
            type="text"
            placeholder="Categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="border rounded-xl px-4 py-3"
          />

          <input
            type="number"
            placeholder="Quantidade disponível"
            value={quantidadeDisponivel}
            onChange={(e) => setQuantidadeDisponivel(e.target.value)}
            className="border rounded-xl px-4 py-3"
          />

          <input
            type="number"
            placeholder="Quantidade reservada"
            value={quantidadeReservada}
            onChange={(e) => setQuantidadeReservada(e.target.value)}
            className="border rounded-xl px-4 py-3"
          />

          <input
            type="number"
            placeholder="Estoque mínimo"
            value={estoqueMinimo}
            onChange={(e) => setEstoqueMinimo(e.target.value)}
            className="border rounded-xl px-4 py-3"
          />

          <input
            type="text"
            placeholder="Unidade"
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
            className="border rounded-xl px-4 py-3"
          />

          <input
            type="text"
            placeholder="Fornecedor"
            value={fornecedor}
            onChange={(e) => setFornecedor(e.target.value)}
            className="border rounded-xl px-4 py-3 col-span-2"
          />

          <div className="col-span-2 border rounded-2xl p-5 mt-2">
            <h3 className="font-bold text-gray-800 mb-4">
              Dados de custo
            </h3>

            <div className="grid grid-cols-2 gap-4">

              <input
                type="number"
                placeholder="Valor da compra"
                value={valorCompra}
                onChange={(e) => setValorCompra(e.target.value)}
                className="border rounded-xl px-4 py-3"
              />

              <input
                type="number"
                placeholder="Quantidade comprada"
                value={quantidadeCompra}
                onChange={(e) => setQuantidadeCompra(e.target.value)}
                className="border rounded-xl px-4 py-3"
              />

            </div>

            <div className="bg-gray-50 rounded-xl p-4 mt-4">
              <p className="text-sm text-gray-500">
                Custo unitário calculado
              </p>

              <p className="font-semibold text-gray-800">
                {formatarMoeda(calcularCustoUnitario())}
              </p>
            </div>
          </div>

        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl border"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            className="bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
          >
            {insumo ? 'Salvar Alterações' : 'Salvar Insumo'}
          </button>
        </div>

      </div>
    </div>
  )
}