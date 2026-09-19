from datetime import datetime
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from models import Subscription

class SubscriptionService:
    @staticmethod
    async def get_subscription(username: str, db: AsyncSession) -> bool:
        username_clean = username.strip().lower()
        result = await db.execute(select(Subscription).where(Subscription.username == username_clean))
        sub = result.scalars().first()
        if not sub:
            # Default subscribed
            return True
        return sub.is_subscribed

    @staticmethod
    async def toggle_subscription(username: str, is_subscribed: bool, db: AsyncSession) -> bool:
        username_clean = username.strip().lower()
        result = await db.execute(select(Subscription).where(Subscription.username == username_clean))
        sub = result.scalars().first()
        if sub:
            sub.is_subscribed = is_subscribed
            sub.updated_at = datetime.utcnow()
        else:
            sub = Subscription(
                username=username_clean,
                is_subscribed=is_subscribed,
                created_at=datetime.utcnow()
            )
            db.add(sub)
        await db.commit()
        return sub.is_subscribed
