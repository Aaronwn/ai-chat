import { ChatBubbleLeftRightIcon, GlobeAltIcon, MagnifyingGlassIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'

const features = [
  { name: '智能对话', icon: '💬', description: '与AI进行自然语言交流' },
  { name: '多语言支持', icon: '🌐', description: '支持多种语言的翻译和对话' },
  { name: '知识查询', icon: '🔍', description: '快速获取各领域的专业知识' },
  { name: '任务协助', icon: '📋', description: '帮助您完成各种日常任务' },
]

export default function FeatureList() {
  return (
    <div className="mt-12">
      <h2 className="text-2xl font-semibold text-center mb-8 text-gray-800">主要功能</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature) => (
          <div key={feature.name} className="bg-white rounded-xl shadow-md p-6 flex items-start space-x-4 hover:shadow-lg transition-shadow">
            <span className="text-4xl">{feature.icon}</span>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.name}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
