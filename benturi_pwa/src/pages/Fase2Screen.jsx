import React from 'react'
import { useTexts } from '../hooks/useTexts'
import PyramidQuestionnaire from '../components/PyramidQuestionnaire'

export default function Fase2Screen() {
  const { t } = useTexts()

  return (
    <div className="screen-container">
      <div className="title">{t('fase2', 'titulo', 'PIRÁMIDE DEL AMOR')}</div>
      <div className="subtitle">{t('fase2', 'subtitulo', 'EVALUACIÓN VIBRACIONAL')}</div>
      <div className="mt-16">
        <PyramidQuestionnaire />
      </div>
    </div>
  )
}
