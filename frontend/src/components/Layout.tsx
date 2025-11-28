import { ReactNode, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { CreateProjectDialog } from './CreateProjectDialog'
import { useQuery } from '@tanstack/react-query'
import { searchApi } from '@/api/search'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateProject, setShowCreateProject] = useState(false)

  const { data: searchResults } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => searchApi.search(searchQuery),
    enabled: searchQuery.length > 2,
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-2">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                PersonalFlow
              </span>
            </Link>

            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search projects, tasks, ideas..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery.length > 2 && searchResults && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border p-4 max-h-96 overflow-y-auto">
                  {searchResults.totalResults === 0 ? (
                    <p className="text-sm text-muted-foreground">No results found</p>
                  ) : (
                    <div className="space-y-3">
                      {searchResults.projects.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-muted-foreground mb-2">
                            Projects
                          </h3>
                          {searchResults.projects.map((project) => (
                            <Link
                              key={project.id}
                              to={`/projects/${project.id}`}
                              className="block p-2 hover:bg-accent rounded-md"
                              onClick={() => setSearchQuery('')}
                            >
                              <p className="font-medium">{project.title}</p>
                            </Link>
                          ))}
                        </div>
                      )}
                      {searchResults.tasks.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-muted-foreground mb-2">
                            Tasks
                          </h3>
                          {searchResults.tasks.map((task) => (
                            <Link
                              key={task.id}
                              to={`/projects/${task.projectId}`}
                              className="block p-2 hover:bg-accent rounded-md"
                              onClick={() => setSearchQuery('')}
                            >
                              <p className="font-medium">{task.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {task.projectTitle}
                              </p>
                            </Link>
                          ))}
                        </div>
                      )}
                      {searchResults.ideas.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-muted-foreground mb-2">
                            Ideas
                          </h3>
                          {searchResults.ideas.map((idea) => (
                            <Link
                              key={idea.id}
                              to={`/projects/${idea.projectId}`}
                              className="block p-2 hover:bg-accent rounded-md"
                              onClick={() => setSearchQuery('')}
                            >
                              <p className="font-medium">{idea.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {idea.projectTitle}
                              </p>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button onClick={() => setShowCreateProject(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">{children}</main>

      <CreateProjectDialog
        open={showCreateProject}
        onOpenChange={setShowCreateProject}
      />
    </div>
  )
}
