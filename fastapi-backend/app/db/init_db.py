from app.db.database import Base, engine
from app.models import student, course, enrollment  # Register with Base

def init_db():
    print('Creating database tables...')
    Base.metadata.create_all(bind=engine)
    print('Done')

if __name__ == '__main__':
    init_db()
