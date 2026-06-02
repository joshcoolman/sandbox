import { loadState, postedToday } from '@/lib/x/state'
import { getQueue, getPosted } from '@/lib/x/queue'
import XAdmin from './XAdmin'

export const metadata = {
  title: 'X Broadcast',
  description: 'Local-only queue for posting notes to X via Web Intent',
}

export default function XPage() {
  const state = loadState()
  return (
    <XAdmin
      initialQueue={getQueue(state)}
      initialPosted={getPosted(state)}
      initialPostsPerDay={state.postsPerDay}
      initialPostedToday={postedToday(state)}
    />
  )
}
