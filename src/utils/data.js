import {
    FolderKanban,
    Gauge,
    LogOut,
    Target,
    UserRoundCog,
    ClipboardList,
    Sparkles,
    MessageSquare,
    Brain,
    CircleCheckBig,
    Route,
    TrendingUp,
} from "lucide-react"


export const DASHBOARD_MENU = [
    { 
        id:"01",
        label:"Dashboard",
        icon:Gauge,
        path:"/dashboard"
    },
    {
        id:"02",
        label:"Manage Projects",
        icon:FolderKanban,
        path:"/admin/tasks"
    },
    {
        id:"03",
        label:"Create Task",
        icon:Target,
        path:"/create-task"
    },
    {
        id:"03a",
        label:"AI Task Creator",
        icon:Sparkles,
        path:"/admin/ai-task-creator"
    },
    {
        id:"03b",
        label:"Chat Assistant",
        icon:MessageSquare,
        path:"/assistant"
    },
    {
        id:"04a",
        label:"Strategic Insights",
        icon:TrendingUp,
        path:"/admin/strategic"
    },
    {
        id:"04",
        label:"Team Members",
        icon:UserRoundCog,
        path:"/admin/users"
    },
    {
        id:"05",
        label:"Logout",
        icon:LogOut,
        path:"/logout"
    }

]

export const SIDE_MENU_USER = [
    {
        id:"",
        label:"My Dashboard",
        icon:Gauge,
        path:"/user/dashboard"
    },
    {
        id:"",
        label:"My Tasks",
        icon:ClipboardList,
        path:"/user/tasks"
    },
    {
        id:"",
        label:"Completed",
        icon:CircleCheckBig,
        path:"/user/completed"
    },
    {
        id:"",
        label:"AI Insights",
        icon:Brain,
        path:"/user/insights"
    },
    {
        id:"",
        label:"Roadmap",
        icon:Route,
        path:"/user/roadmap"
    },
    {
        id:"",
        label:"Chat Assistant",
        icon:MessageSquare,
        path:"/assistant"
    },
    {
        id:"",
        label:"Logout",
        icon:LogOut,
        path:"/user/logout"
    }
]

export const PRIORITY_DATA = [
    { value:"low", label:"Low"},
    { value:"medium", label:"Medium"},
    { value:"high", label:"High"},
]

export const STATUS_DATA = [
    { label:"pending", value:"pending"},
    { label:"in-progress", value:"in-progress"},
    { label:"completed", value:"completed"},
]

