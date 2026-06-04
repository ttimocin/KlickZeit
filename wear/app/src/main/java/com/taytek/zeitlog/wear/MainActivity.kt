package com.taytek.zeitlog.wear

import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.android.gms.wearable.*
import com.google.android.gms.tasks.Tasks
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*

class MainActivity : AppCompatActivity(), DataClient.OnDataChangedListener {
    
    private lateinit var timeTextView: TextView
    private lateinit var dateTextView: TextView
    private lateinit var entryTimeTextView: TextView
    
    private val dataClient: DataClient by lazy {
        Wearable.getDataClient(this)
    }
    
    companion object {
        private const val TAG = "MainActivity"
        private const val ENTRY_TIME_PATH = "/zeitlog/entry_time"
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        try {
            setContentView(R.layout.activity_main)
            
            timeTextView = findViewById(R.id.timeTextView)
            dateTextView = findViewById(R.id.dateTextView)
            entryTimeTextView = findViewById(R.id.entryTimeTextView)
            
            // Saati güncelle
            updateCurrentTime()
            startTimeUpdater()
            
            // Wearable Data Layer'dan giriş saatini dinle
            loadEntryTimeFromPhone()
        } catch (e: Exception) {
            Log.e(TAG, "Error in onCreate", e)
        }
    }
    
    override fun onResume() {
        super.onResume()
        dataClient.addListener(this)
        loadEntryTimeFromPhone()
    }
    
    override fun onPause() {
        super.onPause()
        dataClient.removeListener(this)
    }
    
    override fun onDataChanged(dataEvents: DataEventBuffer) {
        Log.d(TAG, "onDataChanged called, events count: ${dataEvents.count}")
        for (event in dataEvents) {
            Log.d(TAG, "Event type: ${event.type}, path: ${event.dataItem.uri.path}")
            if (event.type == DataEvent.TYPE_CHANGED && event.dataItem.uri.path == ENTRY_TIME_PATH) {
                val dataMap = DataMapItem.fromDataItem(event.dataItem).dataMap
                val entryTime = dataMap.getString("time")
                Log.d(TAG, "Entry time received: $entryTime")
                
                lifecycleScope.launch {
                    withContext(Dispatchers.Main) {
                        if (!entryTime.isNullOrEmpty() && ::entryTimeTextView.isInitialized) {
                            entryTimeTextView.text = "Giriş: $entryTime"
                            Log.d(TAG, "Entry time updated to: $entryTime")
                        } else if (::entryTimeTextView.isInitialized) {
                            entryTimeTextView.text = "Giriş yapılmamış"
                        }
                    }
                }
            }
        }
    }
    
    private fun updateCurrentTime() {
        try {
            val now = Calendar.getInstance()
            val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
            val dateFormat = SimpleDateFormat("dd MMMM yyyy", Locale.getDefault())
            
            if (::timeTextView.isInitialized && ::dateTextView.isInitialized) {
                timeTextView.text = timeFormat.format(now.time)
                dateTextView.text = dateFormat.format(now.time)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error updating time", e)
        }
    }
    
    private fun startTimeUpdater() {
        lifecycleScope.launch {
            while (true) {
                kotlinx.coroutines.delay(1000) // Her saniye güncelle
                withContext(Dispatchers.Main) {
                    updateCurrentTime()
                }
            }
        }
    }
    
    private fun loadEntryTimeFromPhone() {
        if (!::entryTimeTextView.isInitialized) {
            return
        }
        
        lifecycleScope.launch {
            try {
                Log.d(TAG, "Loading entry time from phone, path: $ENTRY_TIME_PATH")
                val dataItems = withContext(Dispatchers.IO) {
                    Tasks.await(dataClient.getDataItems(Uri.parse("wear://*$ENTRY_TIME_PATH")))
                }
                
                Log.d(TAG, "Data items count: ${dataItems.count}")
                withContext(Dispatchers.Main) {
                    if (dataItems.count > 0) {
                        val dataMap = DataMapItem.fromDataItem(dataItems[0]).dataMap
                        val entryTime = dataMap.getString("time")
                        Log.d(TAG, "Entry time from data: $entryTime")
                        
                        if (!entryTime.isNullOrEmpty()) {
                            entryTimeTextView.text = "Giriş: $entryTime"
                        } else {
                            entryTimeTextView.text = "Giriş yapılmamış"
                        }
                    } else {
                        Log.d(TAG, "No data items found")
                        entryTimeTextView.text = "Giriş yapılmamış"
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading entry time", e)
                withContext(Dispatchers.Main) {
                    if (::entryTimeTextView.isInitialized) {
                        entryTimeTextView.text = "Giriş yapılmamış"
                    }
                }
            }
        }
    }
}

