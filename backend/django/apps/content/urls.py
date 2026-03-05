from django.urls import path
from . import views

app_name = 'content'

urlpatterns = [
    path('pages/', views.PageListCreateView.as_view(), name='page-list'),
    path('pages/<uuid:pk>/', views.PageDetailView.as_view(), name='page-detail'),
    path('pages/<uuid:pk>/publish/', views.PagePublishView.as_view(), name='page-publish'),
    path('media/', views.MediaFileListCreateView.as_view(), name='media-list'),
    path('media/<uuid:pk>/', views.MediaFileDetailView.as_view(), name='media-detail'),
]
