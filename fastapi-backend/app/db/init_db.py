from app.db.database import Base, engine
import app.models

if __name__ == '__main__':
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
