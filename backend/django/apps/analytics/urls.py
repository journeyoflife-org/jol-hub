from django.urls import path
from . import views

app_name = 'analytics'

urlpatterns = [
    path('overview/', views.AnalyticsOverviewView.as_view(), name='overview'),
    path('daily/', views.DailyStatsListView.as_view(), name='daily-stats'),
    path('top-parishes/', views.TopParishesView.as_view(), name='top-parishes'),
]
