import { Bell } from 'lucide-react'
import './course-notification.css'

export default function CourseNotification() {
  return <button type="button" className="pro-course-bell"
    aria-label="查看近期實體課程" aria-controls="public-course-card" aria-expanded="false">
    <Bell size={18} strokeWidth={1.7} aria-hidden="true"/>
    <span className="pro-course-bell-dot" aria-hidden="true"/>
  </button>
}
