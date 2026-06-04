package com.taytek.zeitlog.wearabledatalayer

import android.net.Uri
import android.util.Log
import com.google.android.gms.tasks.Tasks
import com.google.android.gms.wearable.DataClient
import com.google.android.gms.wearable.DataMap
import com.google.android.gms.wearable.NodeClient
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.PutDataRequest
import com.google.android.gms.wearable.Wearable
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class WearableDataLayerModule : Module() {
  private val TAG = "WearableDataLayer"
  private val ENTRY_TIME_PATH = "/zeitlog/entry_time"
  
  private val dataClient: DataClient by lazy {
    Wearable.getDataClient(appContext.reactContext ?: throw IllegalStateException("ReactContext is null"))
  }
  
  private val nodeClient: NodeClient by lazy {
    Wearable.getNodeClient(appContext.reactContext ?: throw IllegalStateException("ReactContext is null"))
  }

  override fun definition() = ModuleDefinition {
    Name("WearableDataLayer")

    AsyncFunction("sendEntryTime") { time: String, promise: Promise ->
      CoroutineScope(Dispatchers.IO).launch {
        try {
          Log.d(TAG, "Sending entry time to Wear OS: $time, path: $ENTRY_TIME_PATH")
          
          // Önce bağlı node'ları kontrol et
          val nodes = Tasks.await(nodeClient.getConnectedNodes())
          Log.d(TAG, "Connected nodes before sending: ${nodes.size}")
          
          if (nodes.isEmpty()) {
            Log.w(TAG, "No connected nodes found, but attempting to send anyway")
          }
          
          val putDataReq = PutDataMapRequest.create(ENTRY_TIME_PATH).apply {
            dataMap.putString("time", time)
            setUrgent()
          }.asPutDataRequest()
          
          val result = Tasks.await(dataClient.putDataItem(putDataReq))
          
          Log.d(TAG, "Entry time sent to Wear OS: $time, result: $result")
          promise.resolve(true)
        } catch (e: Exception) {
          Log.e(TAG, "Error sending entry time to Wear OS", e)
          promise.resolve(false)
        }
      }
    }

    AsyncFunction("isAvailable") { promise: Promise ->
      CoroutineScope(Dispatchers.IO).launch {
        try {
          Log.d(TAG, "Checking for connected Wear OS nodes...")
          val nodes = Tasks.await(nodeClient.getConnectedNodes())
          Log.d(TAG, "Connected nodes count: ${nodes.size}")
          nodes.forEachIndexed { index, node ->
            Log.d(TAG, "Node $index: id=${node.id}, name=${node.displayName}, isNearby=${node.isNearby}")
          }
          val hasWearNodes = nodes.isNotEmpty()
          Log.d(TAG, "Wear OS available: $hasWearNodes")
          promise.resolve(hasWearNodes)
        } catch (e: Exception) {
          Log.e(TAG, "Error checking Wear OS availability", e)
          promise.resolve(false)
        }
      }
    }
  }
}

