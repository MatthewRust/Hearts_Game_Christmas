import { Card } from "./ui/card"
import { useNavigate } from "react-router-dom"

export const EventOverviewCard = ({event}) => {
    const navigate = useNavigate()

    const dateOptions = {
        year: "2-digit",
        month: "short",
        day: "numeric",
      };

      const formatPrice = (price) => {
        const cents = Math.round(Number(price) * 100);
        return `${cents}c`;
    };

    return (
        <Card 
            key={event.event_id} 
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/events/${event.event_id}`)}
        >
            <div className="space-y-4">
                <div>
                    <h3 className="font-semibold text-lg line-clamp-2">{event.name}</h3>
                </div>
                
                <div className="space-y-2">
                    {event.outcomes?.map((outcome) => (
                        <div key={outcome.outcome_id} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground truncate mr-2">{outcome.name}</span>
                            <span className="font-medium shrink-0">{formatPrice(outcome.current_price)}</span>
                        </div>
                    ))}
                </div>
                
                <div className="flex items-center gap-2 pt-2">
                    {event.status === 'active' ? 
                        <div className=
                            "size-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_2px_rgba(34,197,94,0.7)]">
                        </div> 
                    : event.status === 'completed' ? 
                        <div className=
                            "size-3 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_2px_rgba(220,38,38,0.7)]">
                        </div>  
                    : event.status === 'upcoming' ? 
                        <div className=
                            "size-3 rounded-full bg-blue-700 animate-pulse shadow-[0_0_8px_2px_rgba(29,78,216,0.7)]">
                        </div>   
                    :
                        <div className=
                            "size-3 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_8px_2px_rgba(253,224,71,0.7)]">
                        </div>   }
                
                <p className="text-sm text-muted-foreground">
                    {new Date(event.start_time).toLocaleDateString(undefined, dateOptions)} to {new Date(event.end_time).toLocaleDateString(undefined, dateOptions)}
                </p>

                </div>
            </div>
        </Card>
    )
}