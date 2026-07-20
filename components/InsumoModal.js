import { useEffect, useState } from 'react'

export default function InsumoModal({
  open,
  onClose,
  onSave,
  insumo
}) {
  const [nome, setNome] = useState('')
  const [categoriaItem, setCategoriaItem] = useState('producao')
  const [vendavel, setVendavel] = useState(false)
  const [precoVenda, setPrecoVenda] = useState('')

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

      setCategoriaItem(
        identificarCategoriaItem(insumo)
      )

      setVendavel(Boolean(insumo.vendavel))

      setPrecoVenda(
        insumo.preco_venda === null ||
        insumo.preco_venda === undefined
          ? ''
          : String(insumo.preco_venda)
      )

      setQuantidadeDisponivel(
        insumo.quantidade_disponivel === null ||
        insumo.quantidade_disponivel === undefined
          ? ''
          : String(insumo.quantidade_disponivel)
      )

      setQuantidadeReservada(
        insumo.quantidade_reservada === null ||
        insumo.quantidade_reservada === undefined
          ? ''
          : String(insumo.quantidade_reservada)
      )

      setEstoqueMinimo(
        insumo.estoque_minimo === null ||
        insumo.estoque_minimo === undefined
          ? ''
          : String(insumo.estoque_minimo)
      )

      setUnidade(insumo.unidade || 'unidade')
      setFornecedor(insumo.fornecedor || '')

      setValorCompra(
        insumo.valor_compra === null ||
        insumo.valor_compra === undefined
          ? ''
          : String(insumo.valor_compra)
      )

      setQuantidadeCompra(
        insumo.quantidade_compra === null ||
        insumo.quantidade_compra === undefined
          ? '1'
          : String(insumo.quantidade_compra)
      )
    } else {
      limparFormulario()
    }
  }, [insumo, open])

  if (!open) return null

  function identificarCategoriaItem(item) {
    if (item?.categoria_item) {
      return item.categoria_item
    }

    const categoriaAntiga = String(
      item?.categoria || ''
    ).toLowerCase()

    if (categoriaAntiga.includes('embalagem')) {
      return 'embalagem'
    }

    if (
      categoriaAntiga.includes('acessório') ||
      categoriaAntiga.includes('acessorio')
    ) {
      return 'acessorio'
    }

    return 'producao'
  }

  function limparFormulario() {
    setNome('')
    setCategoriaItem('producao')
    setVendavel(false)
    setPrecoVenda('')
    setQuantidadeDisponivel('')
    setQuantidadeReservada('')
    setEstoqueMinimo('')
    setUnidade('unidade')
    setFornecedor('')
    setValorCompra('')
    setQuantidadeCompra('1')
  }

  function rotuloCategoria(categoria) {
    if (categoria === 'embalagem') {
      return 'Embalagem'
    }

    if (categoria === 'acessorio') {
      return 'Acessório'
    }

    return 'Produção'
  }

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

  function alterarVendavel(marcado) {
    setVendavel(marcado)

    if (!marcado) {
      setPrecoVenda('')
    }
  }

  function handleSubmit() {
    const nomeTratado = nome.trim()
    const quantidadeCompraNumero =
      Number(quantidadeCompra || 0)

    const precoVendaNumero =
      Number(precoVenda || 0)

    if (!nomeTratado) {
      alert('Informe o nome do item.')
      return
    }

    if (quantidadeCompraNumero <= 0) {
      alert('A quantidade comprada deve ser maior que zero.')
      return
    }

    if (vendavel && precoVendaNumero <= 0) {
      alert(
        'Informe um preço de venda maior que zero para o item vendável.'
      )
      return
    }

    onSave({
      nome: nomeTratado,

      categoria_item: categoriaItem,

      categoria: rotuloCategoria(
        categoriaItem
      ),

      vendavel,

      preco_venda: vendavel
        ? precoVendaNumero
        : 0,

      quantidade_disponivel: Number(
        quantidadeDisponivel || 0
      ),

      quantidade_reservada: Number(
        quantidadeReservada || 0
      ),

      estoque_minimo: Number(
        estoqueMinimo || 0
      ),

      unidade: unidade.trim() || 'unidade',

      fornecedor: fornecedor.trim(),

      valor_compra: Number(
        valorCompra || 0
      ),

      quantidade_compra:
        quantidadeCompraNumero,

      custo_unitario:
        calcularCustoUnitario()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-3xl rounded-2xl p-8 max-h-[85vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {insumo
                ? 'Editar Item do Estoque'
                : 'Novo Item do Estoque'}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Cadastre materiais de produção, embalagens e acessórios.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do item
            </label>

            <input
              type="text"
              placeholder="Ex.: Sacola kraft, tinta ou colher coração"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
            />
          </div>

          <div className="col-span-2 border rounded-2xl p-5">
            <h3 className="font-bold text-gray-800">
              Classificação do item
            </h3>

            <p className="text-sm text-gray-500 mt-1 mb-4">
              Esta classificação define como o item poderá ser usado no ERP.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>

              <select
                value={categoriaItem}
                onChange={(e) => setCategoriaItem(e.target.value)}
                className="w-full border rounded-xl px-4 py-3 bg-white"
              >
                <option value="producao">
                  Produção
                </option>

                <option value="embalagem">
                  Embalagem
                </option>

                <option value="acessorio">
                  Acessório
                </option>
              </select>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mt-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vendavel}
                  onChange={(e) =>
                    alterarVendavel(e.target.checked)
                  }
                  className="mt-1 h-4 w-4"
                />

                <div>
                  <p className="font-semibold text-gray-800">
                    Pode ser vendido separadamente
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    Quando marcado, o item poderá aparecer como adicional em orçamentos, pedidos e kits.
                  </p>
                </div>
              </label>
            </div>

            {vendavel && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço de venda
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={precoVenda}
                  onChange={(e) =>
                    setPrecoVenda(e.target.value)
                  }
                  className="w-full border rounded-xl px-4 py-3"
                />

                <p className="text-xs text-gray-500 mt-2">
                  Na ficha técnica, o item continuará entrando pelo custo unitário. Este valor será usado somente quando ele for vendido separadamente.
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantidade disponível
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={quantidadeDisponivel}
              onChange={(e) =>
                setQuantidadeDisponivel(e.target.value)
              }
              className="w-full border rounded-xl px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantidade reservada
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={quantidadeReservada}
              onChange={(e) =>
                setQuantidadeReservada(e.target.value)
              }
              className="w-full border rounded-xl px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estoque mínimo
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={estoqueMinimo}
              onChange={(e) =>
                setEstoqueMinimo(e.target.value)
              }
              className="w-full border rounded-xl px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unidade de controle
            </label>

            <input
              type="text"
              placeholder="Ex.: unidade, ml, folha ou metro"
              value={unidade}
              onChange={(e) =>
                setUnidade(e.target.value)
              }
              className="w-full border rounded-xl px-4 py-3"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fornecedor
            </label>

            <input
              type="text"
              placeholder="Nome do fornecedor"
              value={fornecedor}
              onChange={(e) =>
                setFornecedor(e.target.value)
              }
              className="w-full border rounded-xl px-4 py-3"
            />
          </div>

          <div className="col-span-2 border rounded-2xl p-5 mt-2">
            <h3 className="font-bold text-gray-800 mb-1">
              Dados de custo
            </h3>

            <p className="text-sm text-gray-500 mb-4">
              O custo unitário será calculado automaticamente.
            </p>

            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor total da compra
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={valorCompra}
                  onChange={(e) =>
                    setValorCompra(e.target.value)
                  }
                  className="w-full border rounded-xl px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade comprada
                </label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="1"
                  value={quantidadeCompra}
                  onChange={(e) =>
                    setQuantidadeCompra(e.target.value)
                  }
                  className="w-full border rounded-xl px-4 py-3"
                />
              </div>

            </div>

            <div className="bg-gray-50 rounded-xl p-4 mt-4">
              <p className="text-sm text-gray-500">
                Custo unitário calculado
              </p>

              <p className="font-semibold text-gray-800 text-lg mt-1">
                {formatarMoeda(
                  calcularCustoUnitario()
                )}
              </p>
            </div>
          </div>

        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-xl border"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
          >
            {insumo
              ? 'Salvar Alterações'
              : 'Salvar Item'}
          </button>
        </div>

      </div>
    </div>
  )
}