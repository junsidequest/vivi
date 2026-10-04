import { Bell } from 'lucide-react'
import './course-notification.css'

export default function CourseNotification({ onClick }) {
  return <button type="button" className="pro-course-bell"
    onClick={onClick} aria-label="查看 LINE 開課通知" aria-controls="course-line-notice">
    <Bell size={18} strokeWidth={1.7} aria-hidden="true"/>
    <span className="pro-course-bell-dot" aria-hidden="true"/>
  </button>
}
