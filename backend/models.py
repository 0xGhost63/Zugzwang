from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, Float
from datetime import datetime
from database import Base

class PlayerCache(Base):
    __tablename__ = "player_caches"

    username = Column(String(100), primary_key=True, index=True)
    profile_data = Column(Text, nullable=False)
    stats_data = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class GameCache(Base):
    __tablename__ = "game_caches"

    game_id = Column(String(100), primary_key=True, index=True)
    username = Column(String(100), index=True, nullable=False)
    pgn = Column(Text, nullable=False)
    white_player = Column(String(100), nullable=False)
    black_player = Column(String(100), nullable=False)
    white_rating = Column(Integer, default=0)
    black_rating = Column(Integer, default=0)
    result = Column(String(50), default="")
    time_class = Column(String(50), default="")
    end_time = Column(DateTime, nullable=True)
    raw_json = Column(Text, nullable=True)

class AnalysisCache(Base):
    __tablename__ = "analysis_caches"

    game_id = Column(String(100), primary_key=True, index=True)
    evaluations = Column(Text, nullable=False)  # JSON formatted move evaluations
    created_at = Column(DateTime, default=datetime.utcnow)

class WeeklySummary(Base):
    __tablename__ = "weekly_summaries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), index=True, nullable=False)
    week_identifier = Column(String(20), nullable=False)  # e.g., "2026-W35"
    summary_report = Column(Text, nullable=False)
    mistake_patterns = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Subscription(Base):
    __tablename__ = "subscriptions"

    username = Column(String(100), primary_key=True, index=True)
    is_subscribed = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
